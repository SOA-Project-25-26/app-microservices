const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');

const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const vendorRoutes = require('./rest/vendorRoutes');
const productRoutes = require('./rest/productRoutes');
const orderRoutes = require('./rest/orderRoutes');

const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  await server.start();

  app.use(bodyParser.json());

  app.use('/api', vendorRoutes);
  app.use('/api', productRoutes);
  app.use('/api', orderRoutes);

  app.use('/graphql', express.json(), expressMiddleware(server));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`REST API: http://localhost:${PORT}/api`);
    console.log(`GraphQL: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);