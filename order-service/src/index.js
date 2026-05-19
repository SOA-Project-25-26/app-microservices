const { initDatabase } = require('./db/database');
const { startServer } = require('./grpc/server');
const { connectProducer, disconnectProducer } = require('./kafka/producer');
const { startConsumer, disconnectConsumer } = require('./kafka/consumer');

const PORT = process.env.PORT || 50053;

async function main() {
  await initDatabase();
  await connectProducer();
  await startConsumer();
  startServer(PORT);
  console.log(`Order service started on port ${PORT}`);
}

process.on('SIGINT', async () => {
  await disconnectProducer();
  await disconnectConsumer();
  process.exit(0);
});

main().catch(console.error);