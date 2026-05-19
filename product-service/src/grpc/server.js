const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const productModel = require('../models/product');

const PROTO_PATH = path.join(__dirname, '../../../proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);

const productService = {
  createProduct: (call, callback) => {
    try {
      const { vendor_id, name, description, price, stock, category } = call.request;
      if (!vendor_id || !name || !price) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'vendor_id, name and price are required' });
      }
      const product = productModel.createProduct(vendor_id, name, description, price, stock, category);
      callback(null, product);
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  getProduct: (call, callback) => {
    try {
      const product = productModel.getProductById(call.request.id);
      if (!product) return callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
      callback(null, product);
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  getProductsByVendor: (call, callback) => {
    try {
      const products = productModel.getProductsByVendor(call.request.vendor_id);
      callback(null, { products });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  updateStock: (call, callback) => {
    try {
      const { product_id, quantity } = call.request;
      const result = productModel.updateStock(product_id, quantity);
      if (!result) return callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
      callback(null, { product_id: result.product_id, new_stock: result.new_stock });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  deleteProduct: (call, callback) => {
    try {
      const success = productModel.deleteProduct(call.request.id);
      callback(null, { success });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  searchProducts: (call, callback) => {
    try {
      const { query, category } = call.request;
      const products = productModel.searchProducts(query, category);
      callback(null, { products });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  }
};

function startServer(port) {
  const server = new grpc.Server();
  server.addService(proto.product.ProductService.service, productService);
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) { console.error('Failed to start server:', err); return; }
    console.log(`Product service running on port ${boundPort}`);
  });
  return server;
}

module.exports = { startServer };