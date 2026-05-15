# app-microservices

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