# MisEventos Frontend

Documentación técnica del cliente web para la plataforma MisEventos.

## Tecnologías Principales

- **Angular 21**: Framework base estructurado con Standalone Components.
- **Angular Signals**: Gestión reactiva del estado interno de los componentes.
- **Tailwind CSS 4**: Motor de estilos de última generación para diseño responsivo y premium.
- **Transloco**: Biblioteca de internacionalización dinámica para soporte multi-idioma.
- **TypeScript**: Lenguaje de programación principal con tipado estricto.

## Estándar de Arquitectura

El proyecto sigue una estructura modular y organizada para garantizar la escalabilidad y el mantenimiento del código. Cada componente se descompone en cuatro archivos fundamentales:

- **Logic (TS)**: Controlador que gestiona los datos y eventos (`*.component.ts`).
- **Template (HTML)**: Estructura semántica de la interfaz (`*.component.html`).
- **Styles (SCSS)**: Estilos encapsulados mediante SASS (`*.component.scss`).
- **Testing (Spec)**: Pruebas unitarias para validar el comportamiento (`*.component.spec.ts`).

## Sistema de Componentes Compartidos

Se ha implementado una biblioteca de componentes internos ubicados en `src/app/presentation/shared/components/` para asegurar la consistencia visual y técnica:

- **ButtonComponent**: Abstracción de botones con soporte para variantes (primary, outline, ghost), tamaños (sm, md, lg, icon) y estados de carga.
- **InputComponent**: Campo de entrada con gestión de iconos, etiquetas dinámicas e integración con formularios reactivos.
- **NavbarComponent**: Navegación principal con diseño glassmorphism y comportamiento responsivo.
- **FooterComponent**: Pie de página informativo con integración del selector de idioma.
- **AvatarComponent**: Representación visual de usuarios con dimensiones normalizadas.
- **SearchBarComponent**: Interfaz de búsqueda con lógica de debounce para optimización de rendimiento.
- **EventCardComponent**: Visualización de información detallada de eventos, incluyendo estados destacados y progreso de capacidad.

## Guía de Desarrollo

### Requisitos Previos

- Node.js (versión compatible con Angular 21)
- npm

### Instalación

```bash
npm install
```

### Servidor de Desarrollo

Para iniciar la aplicación en modo desarrollo:

```bash
npm start
```
El servidor estará disponible por defecto en `http://localhost:4200`.

### Pruebas Unitarias

Para ejecutar el conjunto de pruebas con Vitest:

```bash
npm test
```

## Internacionalización

El sistema utiliza Transloco para la gestión de idiomas. Las definiciones de traducción se encuentran en formato JSON en el directorio público:

- Español: `public/assets/i18n/es.json`
- Inglés: `public/assets/i18n/en.json`
