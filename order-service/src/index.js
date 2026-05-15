const { initDatabase } = require('./db/database');
const { startServer } = require('./grpc/server');

const PORT = process.env.PORT || 50053;

async function main() {
  await initDatabase();
  startServer(PORT);
  console.log(`Order service started on port ${PORT}`);
}

main().catch(console.error);