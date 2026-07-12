# fullstack-payment-poc

POC fullstack de pagos. La aplicación móvil está en `frontend` y fue creada
con React Native 0.86.0.

## Frontend móvil

Todos los comandos de React Native deben ejecutarse desde la carpeta
`frontend`:

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
```

Para instalar dependencias y correr iOS:

```bash
nvm use
npm install
cd ios
pod install
cd ..
npm run ios
```

Más detalle: [`frontend/README.md`](frontend/README.md).
