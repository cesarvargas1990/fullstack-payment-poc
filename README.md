# Fullstack Payment POC

Aplicación fullstack para un checkout móvil con carrito, pago con tarjeta, backend NestJS, MySQL e integración configurable con una API externa de pagos.

## Estructura

```text
.
├── backend/   # API NestJS + MySQL + arquitectura por capas
├── frontend/  # App React Native 0.86.0
├── docs/      # Material de referencia de la prueba
└── docker-compose.yml
```

## Flujo implementado

1. Splash screen nativo.
2. Catálogo de productos consumido desde `GET /products`.
3. Carrito funcional con 1 a N artículos.
4. Checkout con formulario de tarjeta en una interfaz tipo Backdrop.
5. Validación de tarjeta: Visa/Mastercard, Luhn, expiración, CVC, titular y correo.
6. Resumen de pago con confirmación.
7. Una sola transacción por carrito:
   - se crea localmente en `PENDING`;
   - se procesa contra la API externa de pagos;
   - se actualiza con el estado final;
   - si queda aprobada, se descuenta inventario.
8. Pantalla final con resultado, referencia, fecha de cambio de estado y productos pagados.

## Ejecutar todo con Docker

Desde la raíz:

```bash
docker compose up --build
```

Servicios:

```text
API:   http://localhost:3000
MySQL: localhost:3306
```

Por defecto Docker usa `PAYMENTS_MODE=sandbox`, que simula pagos sin secretos.

Para activar la integración real de pagos, exporta variables antes de levantar Docker:

```bash
export PAYMENTS_MODE=external
export PAYMENT_PROVIDER_BASE_URL=https://payment-provider-sandbox.example/v1
export PAYMENT_PROVIDER_PUBLIC_KEY=pub_stagtest_xxx
export PAYMENT_PROVIDER_PRIVATE_KEY=prv_stagtest_xxx
export PAYMENT_PROVIDER_INTEGRITY_SECRET=stagtest_integrity_xxx

docker compose up --build
```

Las llaves reales no se versionan. Para desarrollo local pueden ir en `backend/.env`, que está ignorado por Git.

## Ejecutar backend local

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

Más detalle y curls: [backend/README.md](backend/README.md).

## Ejecutar frontend móvil

```bash
cd frontend
nvm use
npm install
cd ios
pod install
cd ..
npm run ios
```

Más detalle para iOS/Android: [frontend/README.md](frontend/README.md).

## Pruebas y cobertura

Backend:

```bash
cd backend
npm test
npm run test:cov
```

Frontend:

```bash
cd frontend
npm test -- --runInBand
npm run test:cov
```

Estado actual de cobertura:

| Proyecto | Tests | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|---:|
| Backend | 21 passing | 87.56% | 68.05% | 88.23% | 86.47% |
| Frontend | 22 passing | 91.15% | 77.41% | 91.42% | 92.45% |

El umbral configurado en Jest es 80% global para `statements`, `lines` y `functions`.

## GitHub Actions

Workflows activos:

- `.github/workflows/backend-tests.yml`
  - instala dependencias;
  - compila backend;
  - ejecuta tests con coverage;
  - sube artefacto `backend-coverage`.
- `.github/workflows/frontend-tests.yml`
  - instala dependencias;
  - ejecuta TypeScript;
  - ejecuta tests con coverage;
  - sube artefacto `frontend-coverage`.

## Notas de seguridad

- La app móvil no contiene llaves privadas.
- La llave privada y el secreto de integridad viven solo en backend vía variables de entorno.
- `backend/.env` está ignorado por Git.
- El repositorio versiona únicamente placeholders en `.env.example`.
