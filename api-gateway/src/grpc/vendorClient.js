const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../../proto/vendor.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);

const VENDOR_SERVICE_HOST = process.env.VENDOR_SERVICE_HOST || 'localhost:50051';

const client = new proto.vendor.VendorService(
  VENDOR_SERVICE_HOST,
  grpc.credentials.createInsecure()
);

function promisify(call) {
  return new Promise((resolve, reject) => {
    call.on('data', (data) => resolve(data));
    call.on('error', reject);
    call.on('end', () => {});
  });
}

function registerVendor(name, email, password, shopName, shopDescription) {
  return new Promise((resolve, reject) => {
    client.registerVendor(
      { name, email, password, shop_name: shopName, shop_description: shopDescription },
      (err, response) => {
        if (err) reject(err);
        else resolve(response);
      }
    );
  });
}

function getVendor(id) {
  return new Promise((resolve, reject) => {
    client.getVendor({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

function updateVendor(id, shopName, shopDescription) {
  return new Promise((resolve, reject) => {
    client.updateVendor(
      { id, shop_name: shopName, shop_description: shopDescription },
      (err, response) => {
        if (err) reject(err);
        else resolve(response);
      }
    );
  });
}

function getAllVendors() {
  return new Promise((resolve, reject) => {
    client.getAllVendors({}, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

module.exports = { registerVendor, getVendor, updateVendor, getAllVendors, client };