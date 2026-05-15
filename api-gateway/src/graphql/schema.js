const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Vendor {
    id: ID!
    name: String!
    email: String!
    shop_name: String!
    shop_description: String
  }

  type Product {
    id: ID!
    vendor_id: String!
    name: String!
    description: String
    price: Float!
    stock: Int!
    category: String
  }

  type Order {
    id: ID!
    customer_id: String!
    product_id: String!
    vendor_id: String!
    quantity: Int!
    total_price: Float!
    status: String!
    created_at: String
  }

  input CreateVendorInput {
    name: String!
    email: String!
    password: String!
    shop_name: String!
    shop_description: String
  }

  input UpdateVendorInput {
    shop_name: String
    shop_description: String
  }

  input CreateProductInput {
    vendor_id: String!
    name: String!
    description: String
    price: Float!
    stock: Int!
    category: String
  }

  input CreateOrderInput {
    customer_id: String!
    product_id: String!
    vendor_id: String!
    quantity: Int!
  }

  type Query {
    vendors: [Vendor]
    vendor(id: ID!): Vendor
    products(query: String, category: String, vendor_id: String): [Product]
    product(id: ID!): Product
    orders(customer_id: String): [Order]
    order(id: ID!): Order
  }

  type Mutation {
    createVendor(input: CreateVendorInput!): Vendor
    updateVendor(id: ID!, input: UpdateVendorInput!): Vendor
    createProduct(input: CreateProductInput!): Product
    updateProductStock(id: ID!, quantity: Int!): Product
    deleteProduct(id: ID!): DeleteResponse
    createOrder(input: CreateOrderInput!): Order
    updateOrderStatus(id: ID!, status: String!): Order
  }

  type DeleteResponse {
    success: Boolean
  }
`;

module.exports = typeDefs;