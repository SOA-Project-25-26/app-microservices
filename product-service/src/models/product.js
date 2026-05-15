const { getDatabase, saveDatabase } = require('../db/database');

function generateId() {
  return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createProduct(vendorId, name, description, price, stock, category) {
  const db = getDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();

  db.run(
    'INSERT INTO products (id, vendor_id, name, description, price, stock, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, vendorId, name, description || '', price, stock, category || '', createdAt]
  );
  saveDatabase();

  return { id, vendor_id: vendorId, name, description: description || '', price, stock, category: category || '' };
}

function getProductById(id) {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM products WHERE id = ?', [id]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  const columns = result[0].columns;
  const product = {};
  columns.forEach((col, i) => {
    product[col] = row[i];
  });

  return product;
}

function getProductsByVendor(vendorId) {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM products WHERE vendor_id = ?', [vendorId]);

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const product = {};
    columns.forEach((col, i) => {
      product[col] = row[i];
    });
    return product;
  });
}

function updateStock(productId, quantity) {
  const db = getDatabase();
  const product = getProductById(productId);
  
  if (!product) {
    return null;
  }

  const newStock = product.stock + quantity;
  
  db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);
  saveDatabase();

  return { product_id: productId, new_stock: newStock };
}

function deleteProduct(id) {
  const db = getDatabase();
  const product = getProductById(id);
  
  if (!product) {
    return false;
  }

  db.run('DELETE FROM products WHERE id = ?', [id]);
  saveDatabase();
  
  return true;
}

function searchProducts(query, category) {
  const db = getDatabase();
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (query) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${query}%`, `%${query}%`);
  }

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  const result = db.exec(sql, params);

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const product = {};
    columns.forEach((col, i) => {
      product[col] = row[i];
    });
    return product;
  });
}

module.exports = { createProduct, getProductById, getProductsByVendor, updateStock, deleteProduct, searchProducts };