const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'product-service-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'product-service-group' });

const startConsumer = async (db) => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.created', fromBeginning: false });

  console.log('Product Service Kafka consumer connected');

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value.toString());

      if (event.eventType === 'ORDER_CREATED') {
        console.log(`Received ORDER_CREATED for product ${event.productId}`);

        const result = db.exec('SELECT * FROM products WHERE id = ?', [event.productId]);
        
        if (result.length > 0 && result[0].values.length > 0) {
          const columns = result[0].columns;
          const row = result[0].values[0];
          const product = {};
          columns.forEach((col, i) => { product[col] = row[i]; });

          const newStock = product.stock - event.quantity;

          db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, event.productId]);
          
          const { saveDatabase } = require('../db/database');
          saveDatabase();

          console.log(`Stock updated for product ${event.productId}: ${product.stock} → ${newStock}`);

          if (newStock <= 5) {
            const { publishStockLow } = require('./producer');
            await publishStockLow({
              productId: product.id,
              vendorId: product.vendor_id,
              productName: product.name,
              remainingStock: newStock
            });
          }
        }
      }
    }
  });
};

module.exports = { startConsumer };