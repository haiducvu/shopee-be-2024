// const RabbitMQProducer = require('../utils/producer');

const { runProducer } = require('../utils/producer'); // Import the correct function name

// runProducer('email_queue', 'Order confirmation email');
class EmailProducer {
    constructor() {
        this.queue = 'email_queue';
    }

    sendEmail = (message) => {
        runProducer(this.queue, message);
    }
}

exports.EmailProducer = EmailProducer;