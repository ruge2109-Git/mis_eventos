# Mis Eventos - Frontend

Cliente web de la plataforma, construido como una Single Page Application (SPA) haciendo uso de las características más modernas de **Angular 21** junto a **Tailwind CSS**.

## Arquitectura y Patrones

El frontend adopta **Clean Architecture**, aislando estrictamente la lógica de dominio de las implementaciones externas (UI y peticiones HTTP), lo cual facilita el testing y su escalabilidad.

### Patrones y Estrategias:
- **Signals-Based State:** Uso de Angular Signals para una detección de cambios granular, eficiente y reactiva.
- **Container / Presentational Components:** Separación de componentes inteligentes (lógica) y componentes tontos (UI pura).
- **Strategy Pattern:** Implementación de interfaces para servicios y repositorios de datos.
- **Standalone Components:** Arquitectura modular sin NgModules para reducir el boilerplate y mejorar el lazy loading.

```plaintext
frontend/src/app/
├── core/               # Lógica de dominio, Casos de Uso y gestión de Estado (Signals)
├── infrastructure/     # Adaptadores de datos (HTTP Repositories, Storage, Interceptors)
└── presentation/       # Componentes de UI, Layouts, Visuales y Páginas
```

## Stack Técnico e Infraestructura
- **Angular 21 + TypeScript:** Programación estructurada y tipado fuerte.
- **Tailwind CSS v4:** Framework de estilos utility-first con soporte nativo para Glassmorphism.
- **Transloco:** Sistema de internacionalización (i18n) para soporte multi-idioma (ES/EN).
- **Vitest:** Test runner moderno de alta velocidad con soporte nativo para coverage.

## Ejecución Local

Para correr el proyecto fuera de los contenedores para fines de desarrollo, utiliza NPM.

### Prerrequisitos
- Node.js (versión LTS).

### Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install
   ```

2. **Levantar servidor de desarrollo:**
   ```bash
   npm start
   ```
   > La aplicación estará disponible en `http://localhost:4200` y recargará automáticamente ante cualquier cambio.

### Testing y Calidad

El proyecto usa `Vitest` como test runner con cobertura de código.

```bash
# Ejecutar suite de pruebas localmente
npm test

# Correr pruebas localmente y generar reporte de coverage
npm run test:coverage
```

> **Automatización:** Cada vez que el contenedor `frontend` se inicia, ejecuta automáticamente las pruebas de cobertura y el reporte se guarda en `./reports/coverage-frontend/`.  
> Al arrancar, el servidor puede tomar 1~2 minutos en estar disponible mientras Vitest y Angular CLI se inicializan simultáneamente.
