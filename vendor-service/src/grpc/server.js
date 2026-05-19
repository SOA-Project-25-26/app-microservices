const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const vendorModel = require('../models/vendor');

const PROTO_PATH = path.join(__dirname, '../../../proto/vendor.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition);

const vendorService = {
  registerVendor: async (call, callback) => {
    try {
      const { name, email, password, shop_name, shop_description } = call.request;
      console.log('registerVendor called with:', { name, email, shop_name });
      if (!name || !email || !password || !shop_name) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'name, email, password and shop_name are required' });
      }
      const vendor = await vendorModel.createVendor(name, email, password, shop_name, shop_description);
      callback(null, vendor);
    } catch (err) {
      if (err.message === 'Email already registered') {
        return callback({ code: grpc.status.ALREADY_EXISTS, message: err.message });
      }
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  getVendor: (call, callback) => {
    try {
      const vendor = vendorModel.getVendorById(call.request.id);
      if (!vendor) return callback({ code: grpc.status.NOT_FOUND, message: 'Vendor not found' });
      callback(null, vendor);
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  updateVendor: (call, callback) => {
    try {
      const { id, shop_name, shop_description } = call.request;
      const vendor = vendorModel.updateVendor(id, shop_name, shop_description);
      if (!vendor) return callback({ code: grpc.status.NOT_FOUND, message: 'Vendor not found' });
      callback(null, vendor);
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },

  getAllVendors: (call, callback) => {
    try {
      const vendors = vendorModel.getAllVendors();
      callback(null, { vendors });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  }
};

function startServer(port) {
  const server = new grpc.Server();
  server.addService(proto.vendor.VendorService.service, vendorService);
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) { console.error('Failed to start server:', err); return; }
    console.log(`Vendor service running on port ${boundPort}`);
  });
  return server;
}

module.exports = { startServer };