const { createRxDatabase, addRxPlugin } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { RxDBJsonDumpPlugin } = require('rxdb/plugins/json-dump');

addRxPlugin(RxDBJsonDumpPlugin);

const orderSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:          { type: 'string', maxLength: 100 },
    customer_id: { type: 'string' },
    product_id:  { type: 'string' },
    vendor_id:   { type: 'string' },
    quantity:    { type: 'number' },
    total_price: { type: 'number' },
    status:      { type: 'string' },
    created_at:  { type: 'string' }
  },
  required: ['id', 'customer_id', 'product_id', 'vendor_id', 'quantity', 'total_price', 'status', 'created_at']
};

let db = null;
let ordersCollection = null;

async function initDatabase() {
  db = await createRxDatabase({
    name: 'ordersdb',
    storage: getRxStorageMemory()
  });

  await db.addCollections({
    orders: { schema: orderSchema }
  });

  ordersCollection = db.orders;
  console.log('RxDB order database initialized');
  return db;
}

function getCollection() {
  return ordersCollection;
}

module.exports = { initDatabase, getCollection };