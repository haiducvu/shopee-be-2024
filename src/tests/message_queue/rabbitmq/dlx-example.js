// rabbitmq-dlx-example.js
const amqp = require('amqplib');

class RabbitMQDLXExample {
    constructor() {
        // Connection parameters
        this.connectionUrl = 'amqp://guest:guest@localhost:5672';
        this.connection = null;
        this.channel = null;

        // Exchange and queue names
        this.mainExchange = 'main_exchange';
        this.mainQueue = 'main_queue';
        this.dlxExchange = 'dlx_exchange';
        this.dlxQueue = 'dlx_queue';

        // Routing keys
        this.mainRoutingKey = 'main_key';
        this.dlxRoutingKey = 'dlx_key';
    }

    async setup() {
        try {
            // Create connection
            this.connection = await amqp.connect(this.connectionUrl);
            this.channel = await this.connection.createChannel();

            // Declare exchanges
            await this.channel.assertExchange(this.mainExchange, 'direct', { durable: true });
            await this.channel.assertExchange(this.dlxExchange, 'fanout', { durable: true });

            // Declare DLX queue
            await this.channel.assertQueue(this.dlxQueue, { durable: true });

            // Bind DLX queue to DLX exchange
            await this.channel.bindQueue(this.dlxQueue, this.dlxExchange, '');

            // Declare main queue with DLX arguments
            await this.channel.assertQueue(this.mainQueue, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': this.dlxExchange,
                    'x-dead-letter-routing-key': this.dlxRoutingKey,
                    'x-max-length': 1000,                 // Queue length limit scenario
                    'x-max-length-bytes': 10_000_000,     // Queue size limit in bytes
                    'x-message-ttl': 60000,               // Message TTL scenario (60 seconds)
                    'x-expires': 1800000,                 // Queue expiration scenario (30 minutes)
                }
            });

            // Bind main queue to main exchange
            await this.channel.bindQueue(this.mainQueue, this.mainExchange, this.mainRoutingKey);

            this.logMessage('RabbitMQ setup completed with DLX configuration');
            return true;
        } catch (error) {
            this.logMessage(`Error during setup: ${error.message}`);
            throw error;
        }
    }

    async publishMessages(count = 10) {
        try {
            for (let i = 0; i < count; i++) {
                const message = {
                    id: i,
                    timestamp: new Date().toISOString(),
                    data: `Test message ${i}`
                };

                // Set individual message TTL for some messages (5 seconds)
                const options = {
                    persistent: true,
                    contentType: 'application/json',
                    expiration: i % 3 === 0 ? '5000' : undefined
                };

                await this.channel.publish(
                    this.mainExchange,
                    this.mainRoutingKey,
                    Buffer.from(JSON.stringify(message)),
                    options
                );

                this.logMessage(`Published message ${i} to ${this.mainExchange}`);
            }
        } catch (error) {
            this.logMessage(`Error publishing messages: ${error.message}`);
            throw error;
        }
    }

    async consumeMainQueue() {
        try {
            // Set prefetch count
            await this.channel.prefetch(1);

            // Consume messages
            await this.channel.consume(this.mainQueue, async (msg) => {
                if (!msg) return;

                try {
                    const message = JSON.parse(msg.content.toString());
                    this.logMessage(`Processing message: ${JSON.stringify(message)}`);

                    // Simulate different scenarios
                    const messageId = message.id || 0;

                    // Scenario 1: Message rejection (nack with requeue=false)
                    if (messageId % 5 === 0) {
                        this.logMessage(`Explicitly rejecting message ${messageId}`);
                        this.channel.nack(msg, false, false); // requeue=false sends to DLX
                        return;
                    }

                    // Scenario 2: Simulate processing error
                    if (messageId % 7 === 0) {
                        this.logMessage(`Simulating processing error for message ${messageId}`);
                        throw new Error(`Processing error for message ${messageId}`);
                    }

                    // Scenario 3: Message conversion failure
                    if (messageId % 11 === 0) {
                        this.logMessage(`Simulating message conversion failure for ${messageId}`);
                        // In a real scenario, this might be a parsing error
                        this.channel.reject(msg, false); // requeue=false sends to DLX
                        return;
                    }

                    // Normal processing (ack)
                    this.logMessage(`Successfully processed message ${messageId}`);

                    // Add small delay to simulate processing time
                    await new Promise(resolve => setTimeout(resolve, 500));

                    this.channel.ack(msg);
                } catch (error) {
                    this.logMessage(`Error processing message: ${error.message}`);
                    // Messages with processing errors go to DLX
                    this.channel.reject(msg, false); // requeue=false sends to DLX
                }
            }, { noAck: false });

            this.logMessage(`Started consuming from ${this.mainQueue}`);
        } catch (error) {
            this.logMessage(`Error consuming from main queue: ${error.message}`);
            throw error;
        }
    }

    async consumeDLXQueue() {
        try {
            // Set prefetch count
            await this.channel.prefetch(1);

            // Consume messages from DLX queue
            await this.channel.consume(this.dlxQueue, async (msg) => {
                if (!msg) return;

                try {
                    const message = JSON.parse(msg.content.toString());
                    this.logMessage(`DLX received message: ${JSON.stringify(message)}`);

                    // Get death information
                    if (msg.properties.headers && msg.properties.headers['x-death']) {
                        const deathInfo = msg.properties.headers['x-death'][0];
                        const reason = deathInfo.reason || 'unknown';
                        const queue = deathInfo.queue || 'unknown';
                        const timeOfDeath = deathInfo.time || 'unknown';

                        this.logMessage(`Message Death Info - Reason: ${reason}, Queue: ${queue}, Time: ${timeOfDeath}`);
                    }

                    // Process dead-lettered message (e.g., store in database, retry, alert)
                    // For demo purposes, we'll just acknowledge it
                    this.channel.ack(msg);
                } catch (error) {
                    this.logMessage(`Error processing DLX message: ${error.message}`);
                    // Even in DLX, we might have processing errors
                    this.channel.nack(msg, false, true); // Requeue in DLX for retry
                }
            }, { noAck: false });

            this.logMessage(`Started consuming from DLX queue ${this.dlxQueue}`);
        } catch (error) {
            this.logMessage(`Error consuming from DLX queue: ${error.message}`);
            throw error;
        }
    }

    async publishToNonexistentQueue() {
        try {
            // Scenario: Message dropped during routing (no binding match)
            const message = {
                id: Math.floor(Math.random() * 9000) + 1000,
                timestamp: new Date().toISOString(),
                data: "Message with no queue binding"
            };

            // Publishing with a routing key that doesn't match any bindings
            await this.channel.publish(
                this.mainExchange,
                'nonexistent_key',
                Buffer.from(JSON.stringify(message)),
                {
                    persistent: true,
                    contentType: 'application/json'
                }
            );

            this.logMessage('Published message with nonexistent routing key');
        } catch (error) {
            this.logMessage(`Error publishing to nonexistent queue: ${error.message}`);
            throw error;
        }
    }

    async cleanup() {
        try {
            // Delete queues and exchanges
            if (this.channel) {
                await this.channel.deleteQueue(this.mainQueue);
                await this.channel.deleteQueue(this.dlxQueue);
                await this.channel.deleteExchange(this.mainExchange);
                await this.channel.deleteExchange(this.dlxExchange);
            }

            // Close connection
            if (this.connection) {
                await this.connection.close();
            }

            this.logMessage('Cleanup completed');
        } catch (error) {
            this.logMessage(`Error during cleanup: ${error.message}`);
        }
    }

    logMessage(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }
}

// Demo the DLX scenarios
async function main() {
    const example = new RabbitMQDLXExample();

    try {
        // Setup RabbitMQ with DLX
        await example.setup();

        // Publish some messages
        await example.publishMessages(20);

        // Scenario: Message dropped during routing
        await example.publishToNonexistentQueue();

        // Start consumers
        await example.consumeMainQueue();
        await example.consumeDLXQueue();

        // Keep the application running to process messages
        console.log('Application is running. Press Ctrl+C to exit.');

        // Optional: Auto-cleanup after 30 seconds (for demo purposes)
        setTimeout(async () => {
            console.log('Auto-cleanup triggered after 30 seconds');
            await example.cleanup();
            process.exit(0);
        }, 30000);

    } catch (error) {
        console.error(`Error in main: ${error.message}`);
        await example.cleanup();
        process.exit(1);
    }
}

// Alternative: Demo with manually checking DLX queue instead of consumer
async function demoWithChecks() {
    const example = new RabbitMQDLXExample();

    try {
        // Setup RabbitMQ with DLX
        await example.setup();

        // Publish some messages
        await example.publishMessages(20);

        // Scenario: Message dropped during routing
        await example.publishToNonexistentQueue();

        // Process some messages from main queue manually (some will go to DLX)
        for (let i = 0; i < 10; i++) {
            const msg = await example.channel.get(example.mainQueue, { noAck: false });
            if (msg) {
                const message = JSON.parse(msg.content.toString());
                example.logMessage(`Manually processed message: ${JSON.stringify(message)}`);

                // Randomly ack or nack messages to demonstrate DLX
                if (Math.random() > 0.5) {
                    example.channel.ack(msg);
                } else {
                    example.channel.nack(msg, false, false); // Send to DLX
                }
            } else {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Wait for message TTL to expire
        example.logMessage('Waiting for message TTL to expire...');
        await new Promise(resolve => setTimeout(resolve, 6000)); // Wait longer than the 5 second TTL

        // Check DLX queue for messages
        example.logMessage('Checking DLX queue for dead-lettered messages...');

        while (true) {
            const msg = await example.channel.get(example.dlxQueue, { noAck: true });
            if (!msg) break;

            const message = JSON.parse(msg.content.toString());

            // Display death information
            if (msg.properties.headers && msg.properties.headers['x-death']) {
                const deathInfo = msg.properties.headers['x-death'][0];
                const reason = deathInfo.reason || 'unknown';
                example.logMessage(`DLX Message: ${JSON.stringify(message)}, Death reason: ${reason}`);
            } else {
                example.logMessage(`DLX Message without death info: ${JSON.stringify(message)}`);
            }
        }

        // Cleanup and exit
        await example.cleanup();
        process.exit(0);

    } catch (error) {
        console.error(`Error in demo: ${error.message}`);
        await example.cleanup();
        process.exit(1);
    }
}

// Uncomment one of the following to run the desired demo:
// main();
demoWithChecks();