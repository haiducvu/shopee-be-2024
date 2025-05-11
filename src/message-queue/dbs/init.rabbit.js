'use strict'

const amqp = require('amqplib');

const connectToRabbitMQ = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost')
        if (!connection) throw new Error('Connection failed')
        const channel = await connection.createChannel()
        if (!channel) throw new Error('Channel creation failed');
        return { channel, connection }
    }
    catch (error) {
        console.log(`Error`, error)
    }
}

const connectToRabbitMQForTest = async () => {
    try {
        const { channel, connection } = await connectToRabbitMQ()

        // Publish message to a queue
        const queue = 'test-queue'
        const msg = 'Hello shopDEV!'

        await channel.assertQueue(queue, {
            durable: true
        })

        await channel.sendToQueue(queue, Buffer.from(msg))
        console.log(` [x] Sent ${msg} to ${queue}`)

        // close the connection
        await connection.close()
    } catch (error) {
        console.log(`Error connecting to RabbitMQ: ${error}`)
    }
}

const consumerQueue = async (channel, queueName) => {
    try {
        await channel.assertQueue(queueName, { durable: true })
        console.log(`Waiting for message...`);
        channel.consume(queueName, msg => {
            console.log(`Received message: ${queueName}::`, msg.content.toString())
            // 1. find user follow that user
            // 2. send message to user
            // 3. yes, ok =? success
            // 4. error. setup DLX... Dead Letter Exchanges
        }, {
            noAck: true
        })
    }
    catch (error) {
        console.log(`Error publish message to RabbitMQ`, error)
        throw error;
    }
}

module.exports = {
    connectToRabbitMQ,
    connectToRabbitMQForTest,
    consumerQueue
}

