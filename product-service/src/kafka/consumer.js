const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'product-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'product-service-group' });
const admin = kafka.admin();

const startConsumer = async (db) => {
  await admin.connect();
  await admin.createTopics({
    waitForLeaders: true,
    topics: [{ topic: 'order.created', numPartitions: 1, replicationFactor: 1 }]
  });
  await admin.disconnect();

  await consumer.connect();
  await consumer.subscribe({ topic: 'order.created', fromBeginning: false });

  console.log('Product Service Kafka consumer connected, listening on order.created');

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        if (event.eventType === 'ORDER_CREATED') {
          console.log(`Received ORDER_CREATED for product ${event.productId}`);

          const result = db.exec('SELECT * FROM products WHERE id = ?', [event.productId]);

          if (result.length === 0 || result[0].values.length === 0) {
            console.warn(`Product ${event.productId} not found, skipping stock update`);
            return;
          }

          const columns = result[0].columns;
          const row = result[0].values[0];
          const product = {};
          columns.forEach((col, i) => { product[col] = row[i]; });

          const previousStock = product.stock;
          const newStock = previousStock - event.quantity;

          db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, event.productId]);

          const { saveDatabase } = require('../db/database');
          saveDatabase();

          console.log(`Stock updated for product ${event.productId}: ${previousStock} → ${newStock}`);

          const { publishStockUpdated, publishStockLow } = require('./producer');

          await publishStockUpdated({
            productId:     event.productId,
            orderId:       event.orderId,
            previousStock,
            newStock
          });

          if (newStock <= 5) {
            await publishStockLow({
              productId:      product.id,
              vendorId:       product.vendor_id,
              productName:    product.name,
              remainingStock: newStock
            });
          }
        }
      } catch (err) {
        console.error('Error processing order.created event:', err.message);
      }
    }
  });
};

module.exports = { startConsumer };