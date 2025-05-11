const amqp = require('amqplib');

const runConsumer = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        const queueName = 'test-topic';
        await channel.assertQueue(queueName, {
            durable: true
        });

        channel.prefetch(1); // Chỉ nhận tối đa 1 tin nhắn cùng lúc
        // send messages to consumer channel
        channel.consume(queueName, (message) => {
            console.log(`[${getCurrentTime()}] Received message: ${message.content.toString()}`);
            // Xác nhận tin nhắn đã xử lý xong
            channel.ack(message);
        },  { noAck: false }); // Đảm bảo rabbitmq chờ ACK trước khi xoá tin nhắn
        // setTimeout(() => {
        //     connection.close();
        //     process.exit(0);
        // }, 500);
    } catch (error) {
        console.log(error);
    }
}

function getCurrentTime() {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, '0'); // Đảm bảo luôn có 2 chữ số
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Đảm bảo luôn có 2 chữ số
    const seconds = String(now.getSeconds()).padStart(2, '0'); // Đảm bảo luôn có 2 chữ số
    return `${hour}:${minutes}:${seconds}`;
}

runConsumer().catch((error) => {
    console.log(error);
});

