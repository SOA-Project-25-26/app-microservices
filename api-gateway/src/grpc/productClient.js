const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../../proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);

const PRODUCT_SERVICE_HOST = process.env.PRODUCT_SERVICE_HOST || 'localhost:50052';

const client = new proto.product.ProductService(
  PRODUCT_SERVICE_HOST,
  grpc.credentials.createInsecure()
);

function createProduct(vendorId, name, description, price, stock, category) {
  return new Promise((resolve, reject) => {
    client.createProduct(
      { vendor_id: vendorId, name, description, price, stock, category },
      (err, response) => {
        if (err) reject(err);
        else resolve(response);
      }
    );
  });
}

function getProduct(id) {
  return new Promise((resolve, reject) => {
    client.getProduct({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function getProductsByVendor(vendorId) {
  return new Promise((resolve, reject) => {
    client.getProductsByVendor({ vendor_id: vendorId }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function updateStock(productId, quantity) {
  return new Promise((resolve, reject) => {
    client.updateStock({ product_id: productId, quantity }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    client.deleteProduct({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function searchProducts(query, category) {
  return new Promise((resolve, reject) => {
    client.searchProducts({ query, category }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

module.exports = { createProduct, getProduct, getProductsByVendor, updateStock, deleteProduct, searchProducts, client };