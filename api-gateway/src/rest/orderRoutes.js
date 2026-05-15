const express = require('express');
const orderClient = require('../grpc/orderClient');

const router = express.Router();

router.post('/orders', async (req, res) => {
  try {
    const { customer_id, product_id, vendor_id, quantity } = req.body;
    const order = await orderClient.createOrder(customer_id, product_id, vendor_id, quantity);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { customer_id } = req.query;
    if (customer_id) {
      const result = await orderClient.getOrdersByCustomer(customer_id);
      return res.json(result.orders);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await orderClient.getOrder(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(404).json({ error: 'Order not found' });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderClient.updateOrderStatus(req.params.id, status);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;