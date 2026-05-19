const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const orderModel = require('../models/order');
const { publishOrderCreated } = require('../kafka/producer');

const PROTO_PATH = path.join(__dirname, '../../../proto/order.proto');
const PRODUCT_PROTO_PATH = path.join(__dirname, '../../../proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const productPackageDef = protoLoader.loadSync(PRODUCT_PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);
const productProto = grpc.loadPackageDefinition(productPackageDef);

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'localhost:50052';

const productClient = new productProto.product.ProductService(
  PRODUCT_SERVICE_URL,
  grpc.credentials.createInsecure()
);

function getProduct(productId) {
  return new Promise((resolve, reject) => {
    productClient.getProduct({ id: productId }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

const orderService = {
  createOrder: async (call, callback) => {
    try {
      const { customer_id, product_id, vendor_id, quantity } = call.request;

      if (!customer_id || !product_id || !vendor_id) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'customer_id, product_id and vendor_id are required' });
      }
      if (quantity <= 0) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'quantity must be greater than 0' });
      }

      let product;
      try {
        product = await getProduct(product_id);
      } catch (err) {
        return callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
      }

      if (product.stock < quantity) {
        return callback({ code: grpc.status.FAILED_PRECONDITION, message: `Insufficient stock: only ${product.stock} units available` });
      }

      const totalPrice = parseFloat((product.price * quantity).toFixed(2));
      const order = await orderModel.createOrder(customer_id, product_id, vendor_id, quantity, totalPrice);

      await publishOrderCreated({
        orderId:    order.id,
        customerId: customer_id,
        vendorId:   vendor_id,
        productId:  product_id,
        quantity,
        totalPrice
      });

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
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
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