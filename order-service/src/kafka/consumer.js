const { Kafka } = require('kafkajs');
const orderModel = require('../models/order');

const kafka = new Kafka({
  clientId: 'order-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'order-service-group' });
const admin = kafka.admin();

const startConsumer = async () => {
  // Create topic if it doesn't exist yet
  await admin.connect();
  await admin.createTopics({
    waitForLeaders: true,
    topics: [{ topic: 'stock.updated', numPartitions: 1, replicationFactor: 1 }]
  });
  await admin.disconnect();

  await consumer.connect();
  await consumer.subscribe({ topic: 'stock.updated', fromBeginning: false });

  console.log('Order Service Kafka consumer connected, listening on stock.updated');

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        if (event.eventType === 'STOCK_UPDATED') {
          console.log(`Received STOCK_UPDATED for order ${event.orderId}`);

          const order = await orderModel.getOrderById(event.orderId);
          if (!order) {
            console.warn(`Order ${event.orderId} not found, skipping confirmation`);
            return;
          }

          if (order.status === 'pending') {
            await orderModel.updateOrderStatus(event.orderId, 'confirmed');
            console.log(`Order ${event.orderId} confirmed after stock update`);
          }
        }
      } catch (err) {
        console.error('Error processing stock.updated event:', err.message);
      }
    }
  });
};

const disconnectConsumer = async () => {
  await consumer.disconnect();
};

module.exports = { startConsumer, disconnectConsumer };