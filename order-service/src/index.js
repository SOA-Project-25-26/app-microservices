const { initDatabase, getDatabase } = require('./db/database');
const { startServer } = require('./grpc/server');
const { connectProducer, publishOrderCreated, disconnectProducer } = require('./kafka/producer');

const PORT = process.env.PORT || 50053;

async function main() {
  await initDatabase();
  await connectProducer();
  
  const db = getDatabase();
  
  const originalCreateOrder = require('./models/order').createOrder;
  require('./models/order').createOrder = function(customerId, productId, vendorId, quantity, totalPrice) {
    const order = originalCreateOrder(customerId, productId, vendorId, quantity, totalPrice);
    publishOrderCreated({
      orderId: order.id,
      customerId: customerId,
      vendorId: vendorId,
      productId: productId,
      quantity: quantity,
      totalPrice: totalPrice
    });
    return order;
  };

  startServer(PORT);
  console.log(`Order service started on port ${PORT}`);
}

process.on('SIGINT', async () => {
  await disconnectProducer();
  process.exit(0);
});

main().catch(console.error);