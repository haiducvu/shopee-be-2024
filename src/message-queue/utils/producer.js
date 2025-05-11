const amqp = require('amqplib');

const runProducer = async (queueName, message) => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.assertQueue(queueName, {
            durable: true
        });

        // Send messages to the specified queue
        channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });

        console.log(`Message sent to queue "${queueName}":`, message);

        // setTimeout(() => {
        //     connection.close();
        //     process.exit(0);
        // }, 500);
    } catch (error) {
        console.error('Error in producer:', error);
    }
};

module.exports = { runProducer };

// // Example Usage
// runProducer('email_queue', 'Order confirmation email');
// runProducer('inventory_queue', 'Update stock for product ID: 12345');
// runProducer('payment_queue', 'Process payment for Order ID: 67890');



// const amqp = require('amqplib');

// class RabbitMQProducer {
//     constructor(connectionUrl) {
//         this.connectionUrl = connectionUrl;
//         this.connection = null;
//         this.channel = null;
//     }

//     // Initialize connection and channel
//     async connect() {
//         if (!this.connection) {
//             this.connection = await amqp.connect(this.connectionUrl);
//             this.channel = await this.connection.createChannel();
//         }
//     }

//     // Create an exchange
//     async createExchange(exchangeName, type = 'direct', options = { durable: true }) {
//         await this.connect();
//         await this.channel.assertExchange(exchangeName, type, options);
//     }

//     // Create a queue
//     async createQueue(queueName, options = {}) {
//         await this.connect();
//         return await this.channel.assertQueue(queueName, options);
//     }

//     // Bind a queue to an exchange
//     async bindQueue(queueName, exchangeName, routingKey = '') {
//         await this.connect();
//         await this.channel.bindQueue(queueName, exchangeName, routingKey);
//     }

//     // Send a message to a queue
//     async sendMessage(queueName, message, options = {}) {
//         await this.connect();
//         console.log(`Sending message: ${message}`);
//         await this.channel.sendToQueue(queueName, Buffer.from(message), options);
//     }

//     // Close the connection
//     async close() {
//         if (this.connection) {
//             await this.connection.close();
//             this.connection = null;
//             this.channel = null;
//         }
//     }
// }

// module.exports = RabbitMQProducer;
