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
  createOrder: async (call, callback) => {
    try {
      const { customer_id, product_id, vendor_id, quantity } = call.request;
      const order = await orderModel.createOrder(customer_id, product_id, vendor_id, quantity, 0);
      callback(null, order);
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  getOrder: async (call, callback) => {
    try {
      const order = await orderModel.getOrderById(call.request.id);
      if (!order) return callback({ code: grpc.status.NOT_FOUND, message: 'Order not found' });
      callback(null, order);
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  getOrdersByCustomer: async (call, callback) => {
    try {
      const orders = await orderModel.getOrdersByCustomer(call.request.customer_id);
      callback(null, { orders });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  updateOrderStatus: async (call, callback) => {
    try {
      const { order_id, status } = call.request;
      const order = await orderModel.updateOrderStatus(order_id, status);
      if (!order) return callback({ code: grpc.status.NOT_FOUND, message: 'Order not found' });
      callback(null, order);
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  }
};

function startServer(port) {
  const server = new grpc.Server();
  server.addService(proto.order.OrderService.service, orderService);
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) { console.error('Failed to start server:', err); return; }
    console.log(`Order service running on port ${boundPort}`);
  });
  return server;
}

module.exports = { startServer };