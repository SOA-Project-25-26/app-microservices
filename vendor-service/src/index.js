const { initDatabase, getDatabase } = require('./db/database');
const { startServer } = require('./grpc/server');
const { startConsumer } = require('./kafka/consumer');

const PORT = process.env.PORT || 50051;

async function main() {
  await initDatabase();
  
  const db = getDatabase();
  await startConsumer(db);
  
  startServer(PORT);
  console.log(`Vendor service started on port ${PORT}`);
}

main().catch(console.error);