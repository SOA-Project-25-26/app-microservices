const bcrypt = require('bcryptjs');
const { getDatabase, saveDatabase } = require('../db/database');

function generateId() {
  return 'vendor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function createVendor(name, email, password, shopName, shopDescription) {
  const db = getDatabase();

  const existing = db.exec('SELECT id FROM vendors WHERE email = ?', [email]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = generateId();
  const createdAt = new Date().toISOString();

  db.run(
    'INSERT INTO vendors (id, name, email, password, shop_name, shop_description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, email, hashedPassword, shopName, shopDescription || '', createdAt]
  );
  saveDatabase();

  return { id, name, email, shop_name: shopName, shop_description: shopDescription || '' };
}

function getVendorById(id) {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM vendors WHERE id = ?', [id]);

  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const vendor = {};
  columns.forEach((col, i) => { vendor[col] = row[i]; });

  delete vendor.password;
  return vendor;
}

function getAllVendors() {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM vendors');

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const vendor = {};
    columns.forEach((col, i) => { vendor[col] = row[i]; });
    delete vendor.password;
    return vendor;
  });
}

function updateVendor(id, shopName, shopDescription) {
  const db = getDatabase();
  const vendor = getVendorById(id);
  if (!vendor) return null;

  db.run(
    'UPDATE vendors SET shop_name = ?, shop_description = ? WHERE id = ?',
    [shopName || vendor.shop_name, shopDescription || vendor.shop_description, id]
  );
  saveDatabase();

  return getVendorById(id);
}

module.exports = { createVendor, getVendorById, getAllVendors, updateVendor };