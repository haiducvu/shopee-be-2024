const { connectToRabbitMQ } = require("../dbs/init.rabbit");
const handleMessage = require("../utils/consumer");
// const Order = require("../models/orderModel");  // Model đơn hàng

const queueName = "update_db_queue";

const startListenConsumer = async () => {
    const { channel } = await connectToRabbitMQ();
    await handleMessage(channel, queueName, async (data) => {
        console.log(`🔄 Updating database for order ${data.orderId}: ${data.status}`);
        
        // Cập nhật trạng thái đơn hàng trong database
        // await Order.findByIdAndUpdate(data.orderId, { status: data.status });
    });
};

module.exports = {
    startListenConsumer
};
