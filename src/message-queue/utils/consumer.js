module.exports = async (channel, queue, handler) => {
    await channel.assertQueue(queue, { durable: true });

    channel.consume(queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log(`📩 Received message from ${queue}:`, data);
                await handler(data); // Xử lý logic
                channel.ack(msg);
            } catch (error) {
                console.error(`❌ Error processing ${queue}:`, error);
                channel.nack(msg, false, false); // Đưa vào dead-letter queue nếu cần
            }
        }
    });

    console.log(`🚀 Consumer listening on queue: ${queue}`);
};
