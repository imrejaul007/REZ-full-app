# REZ Launch Package

## Quick Start
1. Clone repository
2. Configure .env
3. Run docker-compose up
4. Access services

## Services
| Name | URL | Port |
|------|-----|------|
| API Gateway | http://localhost:3000 | 3000 |
| Auth | http://localhost:4002 | 4002 |
| Wallet | http://localhost:4004 | 4004 |
| Payment | http://localhost:4001 | 4001 |
| Merchant | http://localhost:4005 | 4005 |

## Apps
| App | Build Command |
|-----|--------------|
| Consumer | eas build --platform android |
| Merchant | eas build --platform android |

## Monitoring
| Dashboard | URL |
|-----------|-----|
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |

## APIs
| Service | Docs |
|---------|------|
| Auth | http://localhost:4002/api-docs |
| Wallet | http://localhost:4004/api-docs |
| Payment | http://localhost:4001/api-docs |
