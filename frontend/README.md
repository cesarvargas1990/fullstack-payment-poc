# CheckoutApp móvil

Proyecto base creado con **React Native 0.86.0**, React 19.2.3, TypeScript, Hermes y la nueva arquitectura de React Native.

La pantalla inicial muestra **«Hola mundo»** y está preparada para ejecutarse en el simulador de iOS.

## Requisitos para iOS

- macOS
- Node.js 22.11 o superior
- Xcode con un simulador de iOS instalado
- CocoaPods

## Instalación

Desde esta carpeta:

```bash
nvm use
npm install
cd ios
pod install
cd ..
```

## Ejecutar en iOS

Inicia Metro en una terminal:

```bash
nvm use
npm start
```

En otra terminal, desde esta misma carpeta:

```bash
nvm use
npm run ios
```

Si Xcode abre una ventana de Metro que usa otra versión de Node, configura Node
22 como versión predeterminada de NVM:

```bash
nvm alias default 22
```

## Ejecutar en Android

El SDK local está configurado en `android/local.properties`. Para disponer de
`adb`, `emulator` y las demás herramientas en cualquier terminal, copia las
variables de `.env.android.example` a `~/.zshrc`.

Con un emulador abierto o un teléfono conectado con depuración USB:

```bash
nvm use
npm run android
```

También puedes abrir `ios/CheckoutApp.xcworkspace` en Xcode, seleccionar un simulador y ejecutar el esquema `CheckoutApp`.

## Verificaciones

```bash
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
