const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'vendor-service-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'vendor-service-group' });

const startConsumer = async (db) => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['order.created', 'stock.low'], fromBeginning: false });

  console.log('Vendor Service Kafka consumer connected');

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value.toString());

      if (topic === 'order.created' && event.eventType === 'ORDER_CREATED') {
        console.log(`Vendor ${event.vendorId} notified: new order ${event.orderId}`);

        db.run(
          'INSERT INTO vendor_notifications (vendor_id, message, type, read) VALUES (?, ?, ?, 0)',
          [event.vendorId, `New order ${event.orderId} received for ${event.quantity} item(s) — Total: ${event.totalPrice} TND`, 'NEW_ORDER']
        );

        const { saveDatabase } = require('../db/database');
        saveDatabase();
      }

      if (topic === 'stock.low' && event.eventType === 'STOCK_LOW') {
        console.log(`Vendor ${event.vendorId} notified: low stock for product ${event.productId}`);

        db.run(
          'INSERT INTO vendor_notifications (vendor_id, message, type, read) VALUES (?, ?, ?, 0)',
          [event.vendorId, `Low stock alert: "${event.productName}" has only ${event.remainingStock} units left`, 'STOCK_LOW']
        );

        const { saveDatabase } = require('../db/database');
        saveDatabase();
      }
    }
  });
};

module.exports = { startConsumer };