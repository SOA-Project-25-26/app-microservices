const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'product-service-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('Product Service Kafka producer connected');
};

const publishStockUpdated = async ({ productId, orderId, previousStock, newStock }) => {
  await producer.send({
    topic: 'stock.updated',
    messages: [
      {
        key: orderId,
        value: JSON.stringify({
          eventType:     'STOCK_UPDATED',
          productId,
          orderId,
          previousStock,
          newStock,
          timestamp:     new Date().toISOString()
        })
      }
    ]
  });
  console.log(`Event STOCK_UPDATED published for order ${orderId}`);
};

const publishStockLow = async ({ productId, vendorId, productName, remainingStock }) => {
  await producer.send({
    topic: 'stock.low',
    messages: [
      {
        key: productId,
        value: JSON.stringify({
          eventType:      'STOCK_LOW',
          productId,
          vendorId,
          productName,
          remainingStock,
          timestamp:      new Date().toISOString()
        })
      }
    ]
  });
  console.log(`Event STOCK_LOW published for product ${productId}`);
};

const disconnectProducer = async () => {
  await producer.disconnect();
};

module.exports = { connectProducer, publishStockUpdated, publishStockLow, disconnectProducer };