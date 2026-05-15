const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('Order Service Kafka producer connected');
};

const publishOrderCreated = async (orderData) => {
  await producer.send({
    topic: 'order.created',
    messages: [
      {
        key: orderData.orderId,
        value: JSON.stringify({
          eventType: 'ORDER_CREATED',
          orderId: orderData.orderId,
          customerId: orderData.customerId,
          vendorId: orderData.vendorId,
          productId: orderData.productId,
          quantity: orderData.quantity,
          totalPrice: orderData.totalPrice,
          timestamp: new Date().toISOString()
        })
      }
    ]
  });
  console.log(`Event ORDER_CREATED published for order ${orderData.orderId}`);
};

const disconnectProducer = async () => {
  await producer.disconnect();
};

module.exports = { connectProducer, publishOrderCreated, disconnectProducer };