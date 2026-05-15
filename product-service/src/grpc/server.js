const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const productModel = require('../models/product');

const PROTO_PATH = path.join(__dirname, '../../../proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);

const productService = {
  createProduct: (call, callback) => {
    const { vendor_id, name, description, price, stock, category } = call.request;
    const product = productModel.createProduct(vendor_id, name, description, price, stock, category);
    callback(null, {
      id: product.id,
      vendor_id: product.vendor_id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category
    });
  },

  getProduct: (call, callback) => {
    const product = productModel.getProductById(call.request.id);
    if (!product) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
    }
    callback(null, {
      id: product.id,
      vendor_id: product.vendor_id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category
    });
  },

  getProductsByVendor: (call, callback) => {
    const products = productModel.getProductsByVendor(call.request.vendor_id);
    const productList = products.map(p => ({
      id: p.id,
      vendor_id: p.vendor_id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category
    }));
    callback(null, { products: productList });
  },

  updateStock: (call, callback) => {
    const { product_id, quantity } = call.request;
    const result = productModel.updateStock(product_id, quantity);
    if (!result) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Product not found' });
    }
    callback(null, { product_id: result.product_id, new_stock: result.new_stock });
  },

  deleteProduct: (call, callback) => {
    const success = productModel.deleteProduct(call.request.id);
    callback(null, { success });
  },

  searchProducts: (call, callback) => {
    const { query, category } = call.request;
    const products = productModel.searchProducts(query, category);
    const productList = products.map(p => ({
      id: p.id,
      vendor_id: p.vendor_id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category
    }));
    callback(null, { products: productList });
  }
};

function startServer(port) {
  const server = new grpc.Server();
  server.addService(proto.product.ProductService.service, productService);
  
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to start server:', err);
      return;
    }
    console.log(`Product service running on port ${port}`);
  });

  return server;
}

module.exports = { startServer };