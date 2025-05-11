const amqp = require('amqplib');

const message = 'hello, RabbitMQ Message from Ecommerce'

const runProducer = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        const queueName = 'email_queue'; // test-topic
        await channel.assertQueue(queueName, {
            durable: true
        });
        // send messages to consumer channel
        channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
        console.log('Message sent to queue: ', message);
        setTimeout(() => {
            connection.close();
            process.exit(0);
        }, 500);
    } catch (error) {
        console.log(error);
    }
}

runProducer().catch((error) => {
    console.log(error);
});

