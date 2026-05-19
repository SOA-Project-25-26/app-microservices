const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../../proto/order.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);

const ORDER_SERVICE_HOST = process.env.ORDER_SERVICE_HOST || 'localhost:50053';

const client = new proto.order.OrderService(
  ORDER_SERVICE_HOST,
  grpc.credentials.createInsecure()
);

function createOrder(customerId, productId, vendorId, quantity) {
  return new Promise((resolve, reject) => {
    client.createOrder(
      { customer_id: customerId, product_id: productId, vendor_id: vendorId, quantity },
      (err, response) => {
        if (err) reject(err);
        else resolve(response);
      }
    );
  });
}

function getOrder(id) {
  return new Promise((resolve, reject) => {
    client.getOrder({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function getOrdersByCustomer(customerId) {
  return new Promise((resolve, reject) => {
    client.getOrdersByCustomer({ customer_id: customerId }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function updateOrderStatus(orderId, status) {
  return new Promise((resolve, reject) => {
    client.updateOrderStatus({ order_id: orderId, status }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

module.exports = { createOrder, getOrder, getOrdersByCustomer, updateOrderStatus, client };