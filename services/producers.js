// services/queue/producer.js
const amqp = require('amqplib');
const config = require('../config/rabbitmq');

async function sendToQueue(queueName, message) {
  try {
    const connection = await amqp.connect(config.url);
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
    console.log(`Message sent to queue: ${queueName}`);
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error in sendToQueue:', error);
  }
}

module.exports = { sendToQueue };