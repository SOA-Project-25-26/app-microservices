const { initDatabase } = require('./db/database');
const { startServer } = require('./grpc/server');

const PORT = process.env.PORT || 50052;

async function main() {
  await initDatabase();
  startServer(PORT);
  console.log(`Product service started on port ${PORT}`);
}

main().catch(console.error);