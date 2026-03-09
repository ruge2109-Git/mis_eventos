# Mis Eventos - Frontend

Cliente web SPA de Mis Eventos, desarrollado con Angular y una separacion explicita entre dominio, casos de uso, adaptadores de infraestructura y capa de presentacion.

## Objetivo del servicio

Este frontend implementa la experiencia de:

- autenticacion y registro de usuarios,
- exploracion de eventos publicos,
- flujos de organizador (crear/editar/publicar/cancelar eventos),
- flujos de asistente (inscripciones y calendario),
- vistas administrativas.

## Arquitectura

### Enfoque

La aplicacion usa un enfoque de clean architecture adaptado a Angular:

- `core/domain`: entidades y contratos abstractos (ports),
- `core/application`: casos de uso, guards, store y servicios de aplicacion,
- `infrastructure`: implementaciones HTTP/storage/interceptores,
- `presentation`: layouts, paginas y componentes UI.

### Estructura principal

```plaintext
frontend/src/app/
├── core/
│   ├── domain/
│   │   ├── entities/               # Tipos de negocio del cliente
│   │   ├── ports/                  # Contratos abstractos para acceso a datos
│   │   └── constants/
│   └── application/
│       ├── usecases/               # Orquestacion de operaciones de negocio
│       ├── store/                  # Estado global de autenticacion (Signals)
│       ├── guards/                 # Restricciones de navegacion por rol
│       ├── services/
│       └── tokens/
├── infrastructure/
│   ├── api/                        # Repositorios HTTP y mappers API <-> dominio
│   ├── interceptors/               # Auth, cache, loading y manejo de errores
│   └── storage/                    # Persistencia local (token/perfil)
└── presentation/
    ├── layouts/                    # Estructura por rol/contexto (admin/main/organizer)
    ├── pages/                      # Pantallas de negocio
    └── shared/                     # Componentes reutilizables
```

### Composicion en tiempo de arranque

El archivo `app.config.ts` centraliza el wiring de la app:

- registro de rutas (`provideRouter` + `withViewTransitions`),
- `HttpClient` con interceptores encadenados,
- inyeccion de puertos a implementaciones concretas (repositorios API y storage local),
- configuracion i18n con Transloco (idiomas `es`/`en`),
- inyeccion de `API_BASE_URL` desde `environment`.

## Navegacion y control de acceso

Las rutas se organizan por contexto funcional:

- area administrativa (`/admin`) protegida por `adminGuard`,
- area organizador (`/dashboard/organizer`) protegida por `organizerGuard`,
- area publica/asistente sobre layout principal,
- autenticacion bajo `/auth`.

La seguridad de navegacion se resuelve en guards basados en el estado de `AuthStore`.

## Estado y comunicacion con backend

### Estado

- `AuthStore` usa Angular Signals para modelar estado de sesion (token, rol, usuario, errores, loading).
- El estado inicial se hidrata desde `AuthStorage` (local storage).

### Capa de datos

- Los `ports` del dominio definen el contrato de cada repositorio (`EventRepository`, `AuthRepository`, etc.).
- Los adaptadores de `infrastructure/api` implementan esos contratos con `HttpClient`.
- Los mappers API traducen payloads HTTP a entidades de dominio del frontend.

### Interceptores

Se aplican en este orden:

1. `authInterceptor` agrega JWT si existe,
2. `cacheInterceptor` gestiona cache de peticiones segun reglas del cliente,
3. `loadingInterceptor` sincroniza estado visual de carga,
4. `errorInterceptor` normaliza errores para la capa de presentacion.

## Estandares de codigo

- TypeScript estricto habilitado (`strict`, `noImplicitOverride`, `strictTemplates`, etc.).
- Alias de imports en `tsconfig.json` (`@core`, `@infrastructure`, `@presentation`, etc.) para mantener modularidad.
- Componentes standalone para composicion y lazy loading sin `NgModule`.

## Ejecucion local

### Requisitos

- Node.js LTS
- npm 10+

### Instalacion y arranque

```bash
cd frontend
npm install
npm start
```

La app queda disponible en [http://localhost:4200](http://localhost:4200).

Por defecto en desarrollo, el frontend apunta a `http://localhost:8000` (`src/environments/environment.development.ts`).

## Pruebas y calidad

Comandos principales:

```bash
cd frontend
npm test
```

```bash
cd frontend
npm run test:coverage
```

```bash
cd frontend
npm run lint
```

## Guia de extension

Para añadir una nueva capacidad funcional:

1. Modela entidad/contrato en `core/domain`.
2. Implementa caso(s) de uso en `core/application/usecases`.
3. Implementa repositorio/adaptador en `infrastructure`.
4. Registra el binding del puerto en `app.config.ts`.
5. Consume el caso de uso desde componentes/paginas de `presentation`.
6. Agrega pruebas unitarias del flujo.

Este flujo conserva separacion de responsabilidades y reduce acoplamiento entre UI y API.
