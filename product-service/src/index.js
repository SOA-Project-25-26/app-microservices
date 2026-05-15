const { initDatabase, getDatabase } = require('./db/database');
const { startServer } = require('./grpc/server');
const { connectProducer } = require('./kafka/producer');
const { startConsumer } = require('./kafka/consumer');

const PORT = process.env.PORT || 50052;

async function main() {
  await initDatabase();
  await connectProducer();
  
  const db = getDatabase();
  await startConsumer(db);
  
  startServer(PORT);
  console.log(`Product service started on port ${PORT}`);
}

main().catch(console.error);