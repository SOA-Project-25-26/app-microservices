const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'product-service-producer',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('Product Service Kafka producer connected');
};

const publishStockLow = async (productData) => {
  await producer.send({
    topic: 'stock.low',
    messages: [
      {
        key: productData.productId,
        value: JSON.stringify({
          eventType: 'STOCK_LOW',
          productId: productData.productId,
          vendorId: productData.vendorId,
          productName: productData.productName,
          remainingStock: productData.remainingStock,
          timestamp: new Date().toISOString()
        })
      }
    ]
  });
  console.log(`Event STOCK_LOW published for product ${productData.productId}`);
};

const disconnectProducer = async () => {
  await producer.disconnect();
};

module.exports = { connectProducer, publishStockLow, disconnectProducer };