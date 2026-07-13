# CheckoutApp móvil

Aplicación móvil en **React Native 0.86.0**, React 19.2.3, TypeScript, Redux Toolkit y Hermes.

Implementa el flujo de checkout:

- splash screen;
- catálogo de productos;
- carrito con 1 a N artículos;
- pago con tarjeta en interfaz tipo Backdrop;
- resumen del pago;
- espera visual durante procesamiento;
- pantalla final con resultado de transacción.

## Ubicación

Todos los comandos de React Native deben ejecutarse desde `frontend`:

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
```

No debes crear otro proyecto con `npx react-native init`. El proyecto nativo ya existe en:

```text
frontend/ios
frontend/android
```

## Requisitos

- macOS para iOS.
- Node.js 22.11 o superior.
- Xcode y simulador iOS.
- CocoaPods.
- Android Studio y Android SDK para Android.

## Instalación

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
nvm use
npm install
cd ios
pod install
cd ..
```

## Backend requerido

La app consume:

```text
http://ec2-18-217-182-29.us-east-2.compute.amazonaws.com:3000
```

Esta URL corresponde a la API publicada temporalmente en una instancia AWS EC2 para la prueba.

La URL se configura con `frontend/.env`. Crea el archivo desde el ejemplo:

```bash
cp .env.example .env
```

Contenido para consumir la API publicada:

```dotenv
API_BASE_URL=http://ec2-18-217-182-29.us-east-2.compute.amazonaws.com:3000
```

Antes de ejecutar iOS, Android, Metro o tests, el script `npm run generate:env` crea la configuración local:

```text
src/shared/config/env.ts
```

Ese archivo es local, sale de `frontend/.env` y no se versiona.

Para desarrollo local también puedes levantar el backend desde la raíz y usar `API_BASE_URL=http://localhost:3000`:

```bash
docker compose --env-file backend/.env up --build
```

La API temporal de EC2 usa HTTP. Para que iOS pueda consumirla durante la prueba técnica, `ios/CheckoutApp/Info.plist` permite cargas HTTP mediante App Transport Security con una configuración genérica, sin amarrarla a un dominio específico.

Si `API_BASE_URL` cambia a otro dominio o protocolo, revisa:

```text
ios/CheckoutApp/Info.plist
```

En producción se recomienda usar HTTPS y endurecer la configuración de ATS. Después de cambiar `frontend/.env`, ejecuta `npm run generate:env` y reconstruye la app iOS.

La configuración está en:

```text
frontend/src/shared/config/apiConfig.ts
```

## Ejecutar iOS

Desde `frontend`:

```bash
nvm use
npm run ios
```

Si prefieres Metro separado:

```bash
nvm use
npm start
```

En otra terminal:

```bash
nvm use
npm run ios
```

También puedes abrir:

```text
ios/CheckoutApp.xcworkspace
```

en Xcode, seleccionar simulador y ejecutar el esquema `CheckoutApp`.

## Ejecutar Android

Con un emulador abierto o un teléfono conectado:

```bash
nvm use
npm run android
```

El script `npm run android` usa la ruta local de Corretto 18 configurada para evitar incompatibilidades con Gradle/CMake.

## Flujo de UI

1. Productos: muestra productos e imágenes desde backend.
2. Carrito: permite sumar, restar y quitar productos.
3. Pago con tarjeta:
   - número separado en 4 cuadros;
   - detección Visa/Mastercard;
   - validación Luhn;
   - expiración;
   - CVC;
   - titular;
   - correo.
4. Resumen: muestra total y productos antes de confirmar.
5. Procesando: overlay con spinner mientras espera al backend/API de pagos.
6. Estado final:
   - aprobado en verde;
   - fallido en rojo;
   - referencia;
   - fecha de cambio de estado;
   - productos pagados;
   - botón para volver al inicio.

## Pruebas

```bash
npm test -- --runInBand
npm run test:cov
```

Estado actual:

```text
Test Suites: 6 passed
Tests: 22 passed
Statements: 91.15%
Branches: 77.41%
Functions: 91.42%
Lines: 92.45%
```

Jest exige mínimo 80% global para:

- statements
- lines
- functions

El reporte queda en:

```text
frontend/coverage
```

## Comandos útiles

Instalar pods nuevamente:

```bash
cd ios
pod install
cd ..
```

Configurar Node 22 como versión predeterminada de NVM:

```bash
nvm alias default 22
```

Validaciones comunes:

```bash
npm run test:cov
npx tsc --noEmit
```

## Versiones principales

| Dependencia | Versión |
|---|---:|
| React Native | 0.86.0 |
| React | 19.2.3 |
| TypeScript | 5.8.x |
| Node.js mínimo | 22.11.0 |
