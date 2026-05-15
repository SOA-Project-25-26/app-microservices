const express = require('express');
const productClient = require('../grpc/productClient');

const router = express.Router();

router.post('/products', async (req, res) => {
  try {
    const { vendor_id, name, description, price, stock, category } = req.body;
    const product = await productClient.createProduct(vendor_id, name, description, price, stock, category);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { query, category, vendor_id } = req.query;
    if (vendor_id) {
      const result = await productClient.getProductsByVendor(vendor_id);
      return res.json(result.products);
    }
    const result = await productClient.searchProducts(query || '', category || '');
    res.json(result.products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await productClient.getProduct(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

router.patch('/products/:id/stock', async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await productClient.updateStock(req.params.id, quantity);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const result = await productClient.deleteProduct(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;