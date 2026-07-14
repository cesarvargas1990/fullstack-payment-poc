# Checkout Backend

API en **NestJS + TypeScript + MySQL** para el flujo de checkout de pago.

El backend está diseñado con separación por capas y un puerto de pagos para poder alternar entre modo sandbox local y un adaptador de API externa.

## Arquitectura

```text
src/checkout
├── domain/          # entidades y puertos
├── application/     # casos de uso
├── infrastructure/  # MySQL y adaptadores de pago
└── presentation/    # controladores HTTP y DTOs
```

Capas principales:

- `domain`: tipos de negocio, entidad `Transaction`, puertos de repositorios y pagos.
- `application`: casos de uso para listar productos, crear transacción, pagar y consultar.
- `infrastructure`: repositorios MySQL, migración ligera, seed de productos y gateways de pago.
- `presentation`: endpoints REST y validación de DTOs.

## Variables de entorno

Archivo base:

```bash
cp .env.example .env
```

Variables principales:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=checkout
DB_PASSWORD=checkout
DB_NAME=checkout

PAYMENTS_MODE=sandbox
```

Modos de pago:

- `sandbox`: simula aprobación/rechazo localmente. No requiere secretos.
- `external`: usa la API externa de pagos. Requiere variables `PAYMENT_PROVIDER_*`.

Variables para modo externo:

```dotenv
PAYMENTS_MODE=external
PAYMENT_PROVIDER_BASE_URL=replace-with-provider-api-base-url
PAYMENT_PROVIDER_PUBLIC_KEY=replace-with-public-key
PAYMENT_PROVIDER_PRIVATE_KEY=replace-with-private-key
PAYMENT_PROVIDER_INTEGRITY_SECRET=replace-with-integrity-secret
PAYMENT_PROVIDER_POLL_ATTEMPTS=5
PAYMENT_PROVIDER_POLL_INTERVAL_MS=1000
```

No se deben versionar llaves reales. `backend/.env` está ignorado por Git.

## Ejecutar con Docker

Desde la raíz del repositorio:

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Para EC2 o cualquier ambiente real, configura los valores reales en `backend/.env`. Ese archivo no se versiona. Aunque `DB_HOST` quede como `localhost`, Docker Compose lo reemplaza por `mysql` dentro del contenedor `api`.

```bash
docker compose --env-file backend/.env up --build -d
```

API:

```text
http://localhost:3000
```

## API publicada en EC2

La API también está publicada temporalmente en AWS EC2 para validación externa:

```text
http://ec2-18-217-182-29.us-east-2.compute.amazonaws.com:3000
```

Verificación:

```bash
curl http://ec2-18-217-182-29.us-east-2.compute.amazonaws.com:3000/products
```

El despliegue usa Docker Compose con el backend expuesto en el puerto `3000`.

Si necesitas reconstruir después de cambios de código o schema:

```bash
docker compose down
docker compose --env-file backend/.env up --build --force-recreate
```

## Ejecutar local

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/products` | Lista productos disponibles. |
| `POST` | `/transactions` | Crea una transacción local en `PENDING`. |
| `GET` | `/transactions/:id` | Consulta una transacción. |
| `POST` | `/transactions/:id/pay` | Procesa el pago y actualiza estado. |

## Curls

Listar productos:

```bash
curl http://localhost:3000/products
```

Contra la API publicada:

```bash
curl http://ec2-18-217-182-29.us-east-2.compute.amazonaws.com:3000/products
```

Crear una transacción para todo el carrito:

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "prod-wireless-headphones",
        "quantity": 1
      },
      {
        "productId": "prod-gaming-mouse",
        "quantity": 1
      }
    ],
    "customerEmail": "buyer@example.com"
  }'
```

Respuesta esperada:

```json
{
  "id": "TRANSACTION_ID",
  "status": "PENDING",
  "amountInCents": 22980000,
  "currency": "COP",
  "items": [
    {
      "productId": "prod-wireless-headphones",
      "quantity": 1,
      "amountInCents": 15990000
    }
  ]
}
```

Consultar transacción:

```bash
curl http://localhost:3000/transactions/TRANSACTION_ID
```

Pagar transacción:

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

Después del pago:

```bash
curl http://localhost:3000/transactions/TRANSACTION_ID
```

Campos relevantes:

- `status`: `PENDING`, `APPROVED`, `DECLINED` o `ERROR`.
- `apiTransactionId`: identificador externo de la transacción de pago. Corresponde a `data.id` en la respuesta de la API externa y permite consultar luego `/transactions/{apiTransactionId}` en ese proveedor.
- `providerReference`: referencia externa de checkout. Corresponde a `data.reference`.
- `statusChangedAt`: fecha de cambio de estado. Usa la fecha de finalización del proveedor cuando está disponible.

## Flujo de pago

En modo `external`, `POST /transactions/:id/pay`:

1. Busca la transacción local en `PENDING`.
2. Tokeniza la tarjeta con la API externa.
3. Obtiene tokens de aceptación del comercio.
4. Crea una transacción externa con firma SHA-256.
5. Consulta el estado de la operación.
6. Actualiza la transacción local.
7. Si queda `APPROVED`, descuenta inventario por cada ítem del carrito.

## Pruebas

```bash
cd backend
npm test
npm run test:cov
```

Estado actual:

```text
Test Suites: 7 passed
Tests: 21 passed
Statements: 87.56%
Branches: 68.05%
Functions: 88.23%
Lines: 86.47%
```

Jest exige mínimo 80% global para:

- statements
- lines
- functions

El reporte queda en:

```text
backend/coverage
```
