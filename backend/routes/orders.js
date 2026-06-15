const express = require('express');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { getProducts, addOrder, getOrders, updateOrderStatus } = require('../store');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order items required' });
    }

    const orderItems = await Promise.all(items.map(async (item) => {
      const product = await getProducts().then((products) => products.find((p) => p._id === item.product));
      if (!product) throw new Error('Product not found');
      return {
        product: product._id,
        name: product.name,
        qty: item.qty,
        price: product.price,
      };
    }));

    const total = orderItems.reduce((sum, item) => sum + item.qty * item.price, 0);
    const order = await addOrder({ user: req.user._id, items: orderItems, total });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await getOrders();
    const filtered = req.user.role === 'admin' ? orders : orders.filter((order) => order.user === req.user._id);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await updateOrderStatus(req.params.id, status);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
