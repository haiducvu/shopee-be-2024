const amqp = require('amqplib');

const message = 'hello, RabbitMQ Message from Ecommerce'

// const log = console.log

// console.log = function () {
//     log.apply(console, [new Date()].concat(arguments))
// }


const runProducer = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        const notificationExchange = 'notificationEx' // notification direct
        const notificationQueue = 'notificationQueueProcess' // assertQueue
        const notificationExchangeDLX = 'notificationExDLX' // notificationEx direct 
        const notificationRoutingKeyDLX = 'notificationRoutingKeyDLX' // assert

        // 1. create Exchange
        await channel.assertExchange(notificationExchange, 'direct', {
            durable: true
        })

        // 2. create queue
        const queueResult = await channel.assertQueue(notificationQueue, {
            exclusive: false, // cho phep cac ket noi truy cap vao cung mot luc hang doi
            deadLetterExchange: notificationExchangeDLX,
            deadLetterRoutingKey: notificationRoutingKeyDLX
        })

        console.log('queueResult', queueResult)

        // 3. bindQueue
        await channel.bindQueue(queueResult.queue, notificationExchange)

        // 4. send message
        const msg = 'a new product'
        console.log(`producer msg::`, msg)
        await channel.sendToQueue(queueResult.queue, Buffer.from(msg), {
            expiration: '10000'
        })

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

