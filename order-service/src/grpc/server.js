const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const orderModel = require('../models/order');

const PROTO_PATH = path.join(__dirname, '../../../proto/order.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);

const orderService = {
  createOrder: (call, callback) => {
    const { customer_id, product_id, vendor_id, quantity } = call.request;
    const totalPrice = 0;
    const order = orderModel.createOrder(customer_id, product_id, vendor_id, quantity, totalPrice);
    callback(null, {
      id: order.id,
      customer_id: order.customer_id,
      product_id: order.product_id,
      vendor_id: order.vendor_id,
      quantity: order.quantity,
      total_price: order.total_price,
      status: order.status,
      created_at: order.created_at
    });
  },

  getOrder: (call, callback) => {
    const order = orderModel.getOrderById(call.request.id);
    if (!order) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Order not found' });
    }
    callback(null, {
      id: order.id,
      customer_id: order.customer_id,
      product_id: order.product_id,
      vendor_id: order.vendor_id,
      quantity: order.quantity,
      total_price: order.total_price,
      status: order.status,
      created_at: order.created_at
    });
  },

  getOrdersByCustomer: (call, callback) => {
    const orders = orderModel.getOrdersByCustomer(call.request.customer_id);
    const orderList = orders.map(o => ({
      id: o.id,
      customer_id: o.customer_id,
      product_id: o.product_id,
      vendor_id: o.vendor_id,
      quantity: o.quantity,
      total_price: o.total_price,
      status: o.status,
      created_at: o.created_at
    }));
    callback(null, { orders: orderList });
  },

  updateOrderStatus: (call, callback) => {
    const { order_id, status } = call.request;
    const order = orderModel.updateOrderStatus(order_id, status);
    if (!order) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Order not found' });
    }
    callback(null, {
      id: order.id,
      customer_id: order.customer_id,
      product_id: order.product_id,
      vendor_id: order.vendor_id,
      quantity: order.quantity,
      total_price: order.total_price,
      status: order.status,
      created_at: order.created_at
    });
  }
};

function startServer(port) {
  const server = new grpc.Server();
  server.addService(proto.order.OrderService.service, orderService);
  
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to start server:', err);
      return;
    }
    console.log(`Order service running on port ${port}`);
  });

  return server;
}

module.exports = { startServer };