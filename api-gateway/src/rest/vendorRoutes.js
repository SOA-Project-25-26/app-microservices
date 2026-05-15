const express = require('express');
const vendorClient = require('../grpc/vendorClient');

const router = express.Router();

router.post('/vendors', async (req, res) => {
  try {
    const { name, email, password, shop_name, shop_description } = req.body;
    const vendor = await vendorClient.registerVendor(name, email, password, shop_name, shop_description);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendors', async (req, res) => {
  try {
    const result = await vendorClient.getAllVendors();
    res.json(result.vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendors/:id', async (req, res) => {
  try {
    const vendor = await vendorClient.getVendor(req.params.id);
    res.json(vendor);
  } catch (err) {
    res.status(404).json({ error: 'Vendor not found' });
  }
});

router.put('/vendors/:id', async (req, res) => {
  try {
    const { shop_name, shop_description } = req.body;
    const vendor = await vendorClient.updateVendor(req.params.id, shop_name, shop_description);
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;