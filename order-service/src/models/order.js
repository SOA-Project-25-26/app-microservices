const { getCollection } = require('../db/database');

function generateId() {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function createOrder(customerId, productId, vendorId, quantity, totalPrice) {
  const collection = getCollection();
  const id = generateId();
  const createdAt = new Date().toISOString();

  const doc = {
    id,
    customer_id: customerId,
    product_id:  productId,
    vendor_id:   vendorId,
    quantity,
    total_price: totalPrice,
    status:      'pending',
    created_at:  createdAt
  };

  await collection.insert(doc);
  return doc;
}

async function getOrderById(id) {
  const collection = getCollection();
  const doc = await collection.findOne(id).exec();
  return doc ? doc.toJSON() : null;
}

async function getOrdersByCustomer(customerId) {
  const collection = getCollection();
  const docs = await collection.find({
    selector: { customer_id: customerId }
  }).exec();
  return docs.map(d => d.toJSON());
}

async function updateOrderStatus(orderId, status) {
  const collection = getCollection();
  const doc = await collection.findOne(orderId).exec();
  if (!doc) return null;
  await doc.patch({ status });
  return doc.toJSON();
}

module.exports = { createOrder, getOrderById, getOrdersByCustomer, updateOrderStatus };