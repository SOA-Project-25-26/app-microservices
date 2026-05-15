const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const vendorModel = require('../models/vendor');

const PROTO_PATH = path.join(__dirname, '../../../proto/vendor.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);

const vendorService = {
  registerVendor: (call, callback) => {
    const { name, email, password, shop_name, shop_description } = call.request;
    const vendor = vendorModel.createVendor(name, email, password, shop_name, shop_description);
    callback(null, {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      shop_name: vendor.shop_name,
      shop_description: vendor.shop_description
    });
  },

  getVendor: (call, callback) => {
    const vendor = vendorModel.getVendorById(call.request.id);
    if (!vendor) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Vendor not found' });
    }
    callback(null, {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      shop_name: vendor.shop_name,
      shop_description: vendor.shop_description
    });
  },

  updateVendor: (call, callback) => {
    const { id, shop_name, shop_description } = call.request;
    const vendor = vendorModel.updateVendor(id, shop_name, shop_description);
    if (!vendor) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Vendor not found' });
    }
    callback(null, {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      shop_name: vendor.shop_name,
      shop_description: vendor.shop_description
    });
  },

  getAllVendors: (call, callback) => {
    const vendors = vendorModel.getAllVendors();
    const vendorList = vendors.map(v => ({
      id: v.id,
      name: v.name,
      email: v.email,
      shop_name: v.shop_name,
      shop_description: v.shop_description
    }));
    callback(null, { vendors: vendorList });
  }
};

function startServer(port) {
  const server = new grpc.Server();
  server.addService(proto.vendor.VendorService.service, vendorService);
  
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to start server:', err);
      return;
    }
    console.log(`Vendor service running on port ${port}`);
  });

  return server;
}

module.exports = { startServer };