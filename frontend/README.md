# CheckoutApp movil

Proyecto base creado con **React Native 0.86.0**, React 19.2.3, TypeScript, Hermes y la nueva arquitectura de React Native.

La pantalla inicial muestra **Hola mundo** y esta preparada para ejecutarse en
iOS y Android.

## Ubicacion del proyecto

Ejecuta los comandos de React Native desde esta carpeta:

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
```

No es necesario crear otro proyecto con `npx react-native init`. El proyecto
nativo ya existe dentro de `frontend/ios` y `frontend/android`.

## Requisitos

- macOS
- Node.js 22.11 o superior
- Xcode con un simulador de iOS instalado, para ejecutar iOS
- CocoaPods, para instalar dependencias nativas de iOS
- Android Studio y Android SDK, para ejecutar Android

## Instalación

Desde `frontend`:

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
nvm use
npm install
cd ios
pod install
cd ..
```

## Ejecutar en iOS

Desde `frontend`:

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
nvm use
npm run ios
```

`npm run ios` ejecuta `react-native run-ios` y puede iniciar Metro
automaticamente. Si prefieres tener Metro separado, inicia primero:

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
nvm use
npm start
```

Y luego, en otra terminal:

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
nvm use
npm run ios
```

Tambien puedes abrir `ios/CheckoutApp.xcworkspace` en Xcode, seleccionar un
simulador y ejecutar el esquema `CheckoutApp`.

## Ejecutar en Android

El SDK local está configurado en `android/local.properties`. Para disponer de
`adb`, `emulator` y las demás herramientas en cualquier terminal, copia las
variables de `.env.android.example` a `~/.zshrc`.

Con un emulador abierto o un teléfono conectado con depuración USB:

```bash
nvm use
npm run android
```

## Comandos utiles

Instalar pods nuevamente:

```bash
cd /Users/cesaraugustovargas/Git-projects/fullstack-payment-poc/frontend
nvm use
cd ios
pod install
cd ..
```

Configurar Node 22 como version predeterminada de NVM si Xcode abre Metro con
otra version:

```bash
nvm alias default 22
```

## Verificaciones

```bash
nvm use
npm test -- --runInBand
npm run lint
```

## Versiones principales

| Dependencia | Versión |
|---|---:|
| React Native | 0.86.0 |
| React | 19.2.3 |
| TypeScript | 5.8.x |
| Node.js mínimo | 22.11.0 |

Para Android, el script `npm run android` utiliza Corretto 18 instalado en este
equipo, evitando la incompatibilidad observada entre Java 25 y CMake/Gradle.

La versión 0.86.0 era la versión estable más reciente de React Native al crear este proyecto el 11 de julio de 2026.
