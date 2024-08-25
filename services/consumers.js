// services/queue/consumer.js
const amqp = require('amqplib');
const config = require('../config/rabbitmq');
const transporter = require('../config/transporter'); // Assuming you have this set up

async function startConsumer(queueName) {
  try {
    const connection = await amqp.connect(config.url);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    console.log(`Waiting for messages in ${queueName}`);

    channel.consume(queueName, async (msg) => {
      const content = JSON.parse(msg.content.toString());
      console.log('Received:', content);

      // Send email
      await transporter.sendMail({
        to: content.email,
        from: 'mahajantanmay910@gmail.com',
        subject: 'Signup succeeded!',
        html: '<p>Dear [Recipient],</p><p>Thank you for signing up with our service. We are delighted to welcome you aboard!</p><p>Sincerely,<br>Your Company Name</p>'
      });

      channel.ack(msg);
    }, { noAck: false });

  } catch (error) {
    console.error('Error in startConsumer:', error);
  }
}

module.exports = { startConsumer };