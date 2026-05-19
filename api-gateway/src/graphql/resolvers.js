const vendorClient = require('../grpc/vendorClient');
const productClient = require('../grpc/productClient');
const orderClient = require('../grpc/orderClient');

const resolvers = {
  Query: {
    vendors: async () => {
      const result = await vendorClient.getAllVendors();
      return result.vendors;
    },
    vendor: async (_, { id }) => {
      return await vendorClient.getVendor(id);
    },
    products: async (_, { query, category, vendor_id }) => {
      if (vendor_id) {
        const result = await productClient.getProductsByVendor(vendor_id);
        return result.products;
      }
      const result = await productClient.searchProducts(query || '', category || '');
      return result.products;
    },
    product: async (_, { id }) => {
      return await productClient.getProduct(id);
    },
    orders: async (_, { customer_id }) => {
      if (customer_id) {
        const result = await orderClient.getOrdersByCustomer(customer_id);
        return result.orders;
      }
      return [];
    },
    order: async (_, { id }) => {
      return await orderClient.getOrder(id);
    }
  },

  Mutation: {
    createVendor: async (_, { input }) => {
      const { name, email, password, shop_name, shop_description } = input;
      return await vendorClient.registerVendor(name, email, password, shop_name, shop_description);
    },
    updateVendor: async (_, { id, input }) => {
      const { shop_name, shop_description } = input;
      return await vendorClient.updateVendor(id, shop_name, shop_description);
    },
    createProduct: async (_, { input }) => {
      const { vendor_id, name, description, price, stock, category } = input;
      return await productClient.createProduct(vendor_id, name, description, price, stock, category);
    },
    updateProductStock: async (_, { id, quantity }) => {
      await productClient.updateStock(id, quantity);
      return await productClient.getProduct(id);
    },
    deleteProduct: async (_, { id }) => {
      return await productClient.deleteProduct(id);
    },
    createOrder: async (_, { input }) => {
      const { customer_id, product_id, vendor_id, quantity } = input;
      return await orderClient.createOrder(customer_id, product_id, vendor_id, quantity);
    },
    updateOrderStatus: async (_, { id, status }) => {
      return await orderClient.updateOrderStatus(id, status);
    }
  },

  // Nested resolver: Vendor.products
  Vendor: {
    products: async (parent) => {
      try {
        const result = await productClient.getProductsByVendor(parent.id);
        return result.products;
      } catch (err) {
        return [];
      }
    }
  },

  // Nested resolver: Product.vendor
  Product: {
    vendor: async (parent) => {
      try {
        return await vendorClient.getVendor(parent.vendor_id);
      } catch (err) {
        return null;
      }
    }
  }
};

module.exports = resolvers;