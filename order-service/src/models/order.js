const { getDatabase, saveDatabase } = require('../db/database');

function generateId() {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createOrder(customerId, productId, vendorId, quantity, totalPrice) {
  const db = getDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();

  db.run(
    'INSERT INTO orders (id, customer_id, product_id, vendor_id, quantity, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, customerId, productId, vendorId, quantity, totalPrice, 'pending', createdAt]
  );
  saveDatabase();

  return { id, customer_id: customerId, product_id: productId, vendor_id: vendorId, quantity, total_price: totalPrice, status: 'pending', created_at: createdAt };
}

function getOrderById(id) {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM orders WHERE id = ?', [id]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  const columns = result[0].columns;
  const order = {};
  columns.forEach((col, i) => {
    order[col] = row[i];
  });

  return order;
}

function getOrdersByCustomer(customerId) {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM orders WHERE customer_id = ?', [customerId]);

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const order = {};
    columns.forEach((col, i) => {
      order[col] = row[i];
    });
    return order;
  });
}

function updateOrderStatus(orderId, status) {
  const db = getDatabase();
  const order = getOrderById(orderId);
  
  if (!order) {
    return null;
  }

  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  saveDatabase();

  return getOrderById(orderId);
}

module.exports = { createOrder, getOrderById, getOrdersByCustomer, updateOrderStatus };