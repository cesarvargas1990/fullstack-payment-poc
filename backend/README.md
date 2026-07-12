# Checkout backend

Backend simple en NestJS + MySQL para el flujo de checkout de pago.

## Arquitectura

La carpeta `src/checkout` sigue una separacion por capas:

- `domain`: entidades y puertos.
- `application`: casos de uso.
- `infrastructure`: adaptadores MySQL y pagos sandbox.
- `presentation`: controladores HTTP y DTOs.

## Ejecutar con Docker

Desde la raiz del repositorio:

```bash
docker compose up --build
```

API:

```text
http://localhost:3000
```

## Ejecutar local

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

## Tests

```bash
cd backend
npm test
npm run test:cov
```

## Curls

Listar productos:

```bash
curl http://localhost:3000/products
```

Crear transaccion:

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-wireless-headphones",
    "quantity": 1,
    "customerEmail": "buyer@example.com"
  }'
```

Consultar transaccion:

```bash
curl http://localhost:3000/transactions/TRANSACTION_ID
```

Pagar transaccion aprobada:

```bash
curl -X POST http://localhost:3000/transactions/TRANSACTION_ID/pay \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "4242424242424242",
    "expMonth": "12",
    "expYear": "29",
    "cvc": "123",
    "cardHolder": "Test Buyer"
  }'
```

Pagar transaccion declinada en sandbox:

```bash
curl -X POST http://localhost:3000/transactions/TRANSACTION_ID/pay \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "4000000000000002",
    "expMonth": "12",
    "expYear": "29",
    "cvc": "123",
    "cardHolder": "Test Buyer"
  }'
```
