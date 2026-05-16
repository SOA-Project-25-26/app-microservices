

# 🏪 Projet Microservices — Système de Gestion de Boutique Multi-Vendeurs

## 1. Description du sujet

### 🎯 Concept général

**ShopHub** est une plateforme e-commerce multi-vendeurs permettant à des vendeurs indépendants de créer leur propre boutique en ligne et de vendre leurs produits à des clients. Chaque vendeur gère son catalogue et son stock de manière autonome, tandis que les clients peuvent parcourir les boutiques, passer des commandes et suivre leurs livraisons en temps réel.

La plateforme repose sur une architecture microservices garantissant l'indépendance de chaque domaine métier : la gestion des vendeurs et leurs boutiques, la gestion des produits et du stock, et la gestion des commandes et paiements.

### 🧩 Fonctionnement global

```
Un vendeur s'inscrit et crée sa boutique
    → Il publie ses produits avec prix et stock
        → Un client parcourt les boutiques et choisit un produit
            → Il passe une commande
                → Le stock est automatiquement décrémenté
                    → Le vendeur est notifié de la nouvelle commande
                        → Le client suit l'état de sa commande
```

### 💡 Pourquoi ce sujet est pertinent ?

- Les **interactions entre microservices sont nombreuses et naturelles** : une commande implique forcément le service produit (stock) et le service vendeur (notification).
- **Kafka est pleinement justifié** : la communication entre les services est asynchrone par nature (une commande déclenche une chaîne d'événements).
- **GraphQL est logique** : les clients ont besoin de requêtes flexibles pour filtrer les produits par boutique, catégorie, prix, etc.
- **gRPC est efficace** : la communication interne entre l'API Gateway et les microservices nécessite des appels rapides et typés.
- **REST est adapté** : les opérations CRUD classiques (créer un compte, lister les produits, passer une commande) sont bien couvertes par REST.

---

## 2. Architecture du projet

### 2.1 Vue d'ensemble

```
Client (REST / GraphQL / HTTP)
        │
        ▼
  ┌─────────────┐
  │ API Gateway │  ← Point d'entrée unique
  └──────┬──────┘
         │ gRPC (HTTP/2 + Protobuf)
    ┌────┴─────────────────┐
    │          │           │
    ▼          ▼           ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│Vendor  │ │Product  │ │ Order    │
│Service │ │Service  │ │ Service  │
└───┬────┘ └────┬────┘ └────┬─────┘
    │           │           │
  SQLite3     SQLite3      RxDB
    │           │           │
    └───────────┴───────────┘
                │
          Kafka Broker
```

### 2.2 Composants

| Composant | Rôle | Port |
|---|---|---|
| **API Gateway** | Point d'entrée, expose REST + GraphQL, appelle les services via gRPC | 3000 |
| **Vendor Service** | Gestion des vendeurs et boutiques | 50051 |
| **Product Service** | Gestion des produits et du stock | 50052 |
| **Order Service** | Gestion des commandes | 50053 |
| **Kafka Broker** | Communication asynchrone entre services | 9092 |

---

## 3. Microservices détaillés

### 3.1 Vendor Service

**Responsabilité** : Gérer les comptes vendeurs et leurs boutiques.

**Fonctionnalités :**
- Inscription et authentification d'un vendeur
- Création et mise à jour de la boutique
- Consultation du profil vendeur
- Réception des notifications de nouvelles commandes (via Kafka)

**Base de données** : SQLite3

```
Table: vendors
- id (PK)
- name
- email
- password (hashé)
- shop_name
- shop_description
- created_at

Table: vendor_notifications
- id (PK)
- vendor_id (FK)
- message
- type
- read
- created_at
```

**Interface gRPC exposée :**
```protobuf
service VendorService {
  rpc RegisterVendor(RegisterVendorRequest) returns (VendorResponse);
  rpc GetVendor(GetVendorRequest) returns (VendorResponse);
  rpc UpdateVendor(UpdateVendorRequest) returns (VendorResponse);
  rpc GetAllVendors(Empty) returns (VendorListResponse);
}
```

---

### 3.2 Product Service

**Responsabilité** : Gérer le catalogue de produits et le stock.

**Fonctionnalités :**
- Ajout, modification, suppression d'un produit
- Consultation des produits par boutique/vendeur
- Gestion du stock (décrémentation lors d'une commande)
- Publication d'un événement Kafka si le stock devient critique (≤ 5)

**Base de données** : SQLite3

```
Table: products
- id (PK)
- vendor_id (FK)
- name
- description
- price
- stock
- category
- created_at

Table: categories
- id (PK)
- name
```

**Interface gRPC exposée :**
```protobuf
service ProductService {
  rpc CreateProduct(CreateProductRequest) returns (ProductResponse);
  rpc GetProduct(GetProductRequest) returns (ProductResponse);
  rpc GetProductsByVendor(GetByVendorRequest) returns (ProductListResponse);
  rpc UpdateStock(UpdateStockRequest) returns (StockResponse);
  rpc DeleteProduct(DeleteProductRequest) returns (DeleteResponse);
  rpc SearchProducts(SearchRequest) returns (ProductListResponse);
}
```

---

### 3.3 Order Service

**Responsabilité** : Gérer le cycle de vie des commandes.

**Fonctionnalités :**
- Création d'une commande
- Suivi de l'état d'une commande (pending → confirmed → shipped → delivered)
- Historique des commandes d'un client
- Publication d'un événement Kafka lors d'une nouvelle commande
- Consommation d'un événement Kafka pour confirmer la disponibilité du stock

**Base de données** : RxDB (NoSQL)

```json
// Document Order
{
  "id": "uuid",
  "customerId": "string",
  "vendorId": "string",
  "productId": "string",
  "quantity": "number",
  "totalPrice": "number",
  "status": "pending | confirmed | shipped | delivered | cancelled",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

**Interface gRPC exposée :**
```protobuf
service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
  rpc GetOrder(GetOrderRequest) returns (OrderResponse);
  rpc GetOrdersByCustomer(GetByCustomerRequest) returns (OrderListResponse);
  rpc UpdateOrderStatus(UpdateStatusRequest) returns (OrderResponse);
}
```

---

## 4. API Gateway

### 4.1 Rôle

L'API Gateway est le **seul point d'entrée** de l'application. Elle :
- Expose une interface **REST** et **GraphQL** au client
- Communique avec les microservices via **gRPC**
- Ne contient **aucune logique métier**

### 4.2 Endpoints REST

#### Vendors
| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/vendors/register` | Inscription d'un vendeur |
| GET | `/api/vendors/:id` | Récupérer un vendeur |
| PUT | `/api/vendors/:id` | Mettre à jour un vendeur |
| GET | `/api/vendors` | Lister tous les vendeurs |

#### Products
| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/products` | Créer un produit |
| GET | `/api/products/:id` | Récupérer un produit |
| GET | `/api/products?vendorId=X` | Produits d'un vendeur |
| PUT | `/api/products/:id` | Modifier un produit |
| DELETE | `/api/products/:id` | Supprimer un produit |
| GET | `/api/products/search?q=X` | Rechercher un produit |

#### Orders
| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Passer une commande |
| GET | `/api/orders/:id` | Récupérer une commande |
| GET | `/api/orders?customerId=X` | Commandes d'un client |
| PUT | `/api/orders/:id/status` | Mettre à jour le statut |

### 4.3 Schéma GraphQL

```graphql
type Vendor {
  id: ID!
  name: String!
  email: String!
  shopName: String!
  shopDescription: String
  products: [Product]
}

type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  stock: Int!
  category: String
  vendor: Vendor
}

type Order {
  id: ID!
  customerId: String!
  product: Product
  quantity: Int!
  totalPrice: Float!
  status: String!
  createdAt: String!
}

type Query {
  getVendor(id: ID!): Vendor
  getAllVendors: [Vendor]
  getProduct(id: ID!): Product
  getProductsByVendor(vendorId: ID!): [Product]
  searchProducts(query: String!, category: String): [Product]
  getOrder(id: ID!): Order
  getOrdersByCustomer(customerId: ID!): [Order]
}

type Mutation {
  registerVendor(name: String!, email: String!, password: String!, shopName: String!): Vendor
  createProduct(vendorId: ID!, name: String!, price: Float!, stock: Int!): Product
  createOrder(customerId: ID!, productId: ID!, quantity: Int!): Order
  updateOrderStatus(orderId: ID!, status: String!): Order
}
```

---

## 5. Communication Kafka

### 5.1 Topics et événements

| Topic | Producteur | Consommateur | Déclencheur |
|---|---|---|---|
| `order.created` | Order Service | Product Service, Vendor Service | Nouvelle commande passée |
| `stock.updated` | Product Service | Order Service | Stock décrémenté après commande |
| `stock.low` | Product Service | Vendor Service | Stock ≤ 5 unités |
| `order.confirmed` | Order Service | (log / notification) | Commande confirmée |

### 5.2 Format des messages

**Topic `order.created` :**
```json
{
  "eventType": "ORDER_CREATED",
  "orderId": "uuid",
  "customerId": "string",
  "vendorId": "string",
  "productId": "string",
  "quantity": 2,
  "totalPrice": 59.99,
  "timestamp": "2025-05-15T10:00:00Z"
}
```

**Topic `stock.updated` :**
```json
{
  "eventType": "STOCK_UPDATED",
  "productId": "string",
  "previousStock": 10,
  "newStock": 8,
  "orderId": "uuid",
  "timestamp": "2025-05-15T10:00:01Z"
}
```

**Topic `stock.low` :**
```json
{
  "eventType": "STOCK_LOW",
  "productId": "string",
  "vendorId": "string",
  "productName": "string",
  "remainingStock": 3,
  "timestamp": "2025-05-15T10:00:01Z"
}
```

### 5.3 Scénario métier complet

```
1. Client passe une commande (REST POST /api/orders)
2. API Gateway appelle OrderService.CreateOrder() via gRPC
3. Order Service crée la commande avec statut "pending"
4. Order Service publie un événement sur le topic "order.created"
5. Product Service consomme l'événement → décrémente le stock
6. Product Service publie sur "stock.updated"
7. Si stock ≤ 5 → Product Service publie sur "stock.low"
8. Vendor Service consomme "order.created" → notifie le vendeur
9. Vendor Service consomme "stock.low" → alerte le vendeur
10. Order Service met à jour le statut → "confirmed"
```

---

## 6. Fichiers .proto

### vendor.proto
```protobuf
syntax = "proto3";
package vendor;

service VendorService {
  rpc RegisterVendor(RegisterVendorRequest) returns (VendorResponse);
  rpc GetVendor(GetVendorRequest) returns (VendorResponse);
  rpc UpdateVendor(UpdateVendorRequest) returns (VendorResponse);
  rpc GetAllVendors(Empty) returns (VendorListResponse);
}

message RegisterVendorRequest {
  string name = 1;
  string email = 2;
  string password = 3;
  string shop_name = 4;
  string shop_description = 5;
}

message GetVendorRequest { string id = 1; }
message UpdateVendorRequest {
  string id = 1;
  string shop_name = 2;
  string shop_description = 3;
}

message VendorResponse {
  string id = 1;
  string name = 2;
  string email = 3;
  string shop_name = 4;
  string shop_description = 5;
}

message VendorListResponse { repeated VendorResponse vendors = 1; }
message Empty {}
```

### product.proto
```protobuf
syntax = "proto3";
package product;

service ProductService {
  rpc CreateProduct(CreateProductRequest) returns (ProductResponse);
  rpc GetProduct(GetProductRequest) returns (ProductResponse);
  rpc GetProductsByVendor(GetByVendorRequest) returns (ProductListResponse);
  rpc UpdateStock(UpdateStockRequest) returns (StockResponse);
  rpc DeleteProduct(DeleteProductRequest) returns (DeleteResponse);
  rpc SearchProducts(SearchRequest) returns (ProductListResponse);
}

message CreateProductRequest {
  string vendor_id = 1;
  string name = 2;
  string description = 3;
  float price = 4;
  int32 stock = 5;
  string category = 6;
}

message GetProductRequest { string id = 1; }
message GetByVendorRequest { string vendor_id = 1; }
message UpdateStockRequest { string product_id = 1; int32 quantity = 2; }
message DeleteProductRequest { string id = 1; }
message SearchRequest { string query = 1; string category = 2; }

message ProductResponse {
  string id = 1;
  string vendor_id = 2;
  string name = 3;
  string description = 4;
  float price = 5;
  int32 stock = 6;
  string category = 7;
}

message StockResponse { string product_id = 1; int32 new_stock = 2; }
message DeleteResponse { bool success = 1; }
message ProductListResponse { repeated ProductResponse products = 1; }
```

### order.proto
```protobuf
syntax = "proto3";
package order;

service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
  rpc GetOrder(GetOrderRequest) returns (OrderResponse);
  rpc GetOrdersByCustomer(GetByCustomerRequest) returns (OrderListResponse);
  rpc UpdateOrderStatus(UpdateStatusRequest) returns (OrderResponse);
}

message CreateOrderRequest {
  string customer_id = 1;
  string product_id = 2;
  string vendor_id = 3;
  int32 quantity = 4;
}

message GetOrderRequest { string id = 1; }
message GetByCustomerRequest { string customer_id = 1; }
message UpdateStatusRequest { string order_id = 1; string status = 2; }

message OrderResponse {
  string id = 1;
  string customer_id = 2;
  string product_id = 3;
  string vendor_id = 4;
  int32 quantity = 5;
  float total_price = 6;
  string status = 7;
  string created_at = 8;
}

message OrderListResponse { repeated OrderResponse orders = 1; }
```

---

## 7. Structure du repository GitHub

```
shophub-microservices/
├── README.md
├── docker-compose.yml          # (optionnel)
├── docs/
│   ├── architecture.png
│   ├── kafka-topics.md
│   └── api-reference.md
├── proto/
│   ├── vendor.proto
│   ├── product.proto
│   └── order.proto
├── api-gateway/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── rest/
│   │   │   ├── vendorRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   └── orderRoutes.js
│   │   ├── graphql/
│   │   │   ├── schema.js
│   │   │   └── resolvers.js
│   │   └── grpc/
│   │       ├── vendorClient.js
│   │       ├── productClient.js
│   │       └── orderClient.js
├── vendor-service/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── grpc/server.js
│   │   ├── kafka/consumer.js
│   │   ├── db/database.js
│   │   └── models/vendor.js
├── product-service/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── grpc/server.js
│   │   ├── kafka/
│   │   │   ├── producer.js
│   │   │   └── consumer.js
│   │   ├── db/database.js
│   │   └── models/product.js
└── order-service/
    ├── package.json
    ├── src/
    │   ├── index.js
    │   ├── grpc/server.js
    │   ├── kafka/producer.js
    │   ├── db/database.js
    │   └── models/order.js
```

---

## 8. Stack technique

| Technologie | Usage | Package npm |
|---|---|---|
| **Node.js** | Runtime principal | — |
| **Express.js** | API REST (Gateway) | `express` |
| **Apollo Server** | GraphQL (Gateway) | `@apollo/server` |
| **gRPC** | Communication inter-services | `@grpc/grpc-js`, `@grpc/proto-loader` |
| **KafkaJS** | Broker Kafka | `kafkajs` |
| **SQLite3** | Base de données SQL | `better-sqlite3` |
| **RxDB** | Base de données NoSQL | `rxdb` |
| **Kafka KRaft** | Mode natif Kafka 4.x (sans Zookeeper) | (Docker) |

---

## 9. Instructions d'installation et d'exécution

### Prérequis
- Node.js v18+
- npm
- Docker + Docker Compose (pour Kafka en mode KRaft)

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/SOA-Project-25-26/app-microservices
cd app-microservices

# 2. Démarrer Kafka (mode KRaft, sans Zookeeper)
docker-compose up -d kafka

# 3. Installer les dépendances de chaque service
cd vendor-service && npm install && cd ..
cd product-service && npm install && cd ..
cd order-service && npm install && cd ..
cd api-gateway && npm install && cd ..

# 4. Démarrer les microservices (dans des terminaux séparés)
cd vendor-service && node src/index.js
cd product-service && node src/index.js
cd order-service && node src/index.js

# 5. Démarrer l'API Gateway
cd api-gateway && node src/index.js

# 6. Accéder à l'application
# REST : http://localhost:3000/api/...
# GraphQL : http://localhost:3000/graphql
```

## Dependency matrix

| Package | API Gateway | Vendor Service | Product Service | Order Service |
|---|---:|---:|---:|---:|
| express | ✅ | ❌ | ❌ | ❌ |
| @apollo/server + graphql | ✅ | ❌ | ❌ | ❌ |
| @grpc/grpc-js | ✅ | ✅ | ✅ | ✅ |
| @grpc/proto-loader | ✅ | ✅ | ✅ | ✅ |
| kafkajs | ❌ | ✅ | ✅ | ✅ |
| better-sqlite3 | ❌ | ✅ | ✅ | ❌ |
| rxdb | ❌ | ❌ | ❌ | ✅ |

> Note: some native packages (e.g. `better-sqlite3`) may require native build tools on Windows (Visual Studio C++ workload). If installation fails, install the required build tools or consider using an alternative package.