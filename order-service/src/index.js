const { initDatabase } = require('./db/database');
const { startServer } = require('./grpc/server');
const { connectProducer, disconnectProducer } = require('./kafka/producer');

const PORT = process.env.PORT || 50053;

async function main() {
  await initDatabase();
  await connectProducer();
  startServer(PORT);
  console.log(`Order service started on port ${PORT}`);
}

process.on('SIGINT', async () => {
  await disconnectProducer();
  process.exit(0);
});

main().catch(console.error);