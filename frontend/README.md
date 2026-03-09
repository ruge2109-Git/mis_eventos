# Mis Eventos - Frontend

Cliente web de la plataforma Mis Eventos, construido con Angular y arquitetura limpia.

---

## Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Componentes Compartidos](#componentes-compartidos)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Internacionalización](#internacionalización)
- [Testing](#testing)

---

## Tecnologías

| Tecnología | Propósito |
|------------|-----------|
| **Angular 21** | Framework con Standalone Components |
| **Angular Signals** | Estado reactivo |
| **Tailwind CSS 4** | Estilos responsivos |
| **Transloco** | Internacionalización |
| **TypeScript** | Tipado estricto |
| **RxJS** | Programación reactiva |
| **Vitest** | Testing |

---

## Arquitectura

El proyecto sigue **Clean Architecture** con separación clara de responsabilidades:

```
frontend/src/app/
├── core/                      # Núcleo de la aplicación
│   ├── domain/               # Entidades y constantes
│   │   ├── entities/        # Tipos (Event, User, Registration)
│   │   └── constants/       # Roles de usuario
│   ├── application/         # Lógica de negocio
│   │   ├── usecases/       # Casos de uso
│   │   ├── services/       # Servicios (Toast, Validation)
│   │   ├── guards/         # Protectores de rutas
│   │   └── store/          # Estado global
│   └── utils/              # Utilidades
├── infrastructure/          # Integraciones externas
│   ├── api/                # Repositorios HTTP
│   ├── interceptors/       # HTTP interceptors
│   └── storage/            # Local storage
└── presentation/            # Capa de presentación
    ├── layouts/            # Layouts (Main, Admin, Organizer)
    └── pages/              # Páginas de características
```

---

## Estructura de Componentes

Cada componente sigue el patrón de 4 archivos:

| Archivo | Propósito |
|---------|-----------|
| `*.component.ts` | Lógica y estado |
| `*.component.html` | Template |
| `*.component.scss` | Estilos encapsulados |
| `*.component.spec.ts` | Pruebas unitarias |

---

## Componentes Compartidos

Biblioteca de componentes internos en `src/app/presentation/shared/components/`:

| Componente | Descripción |
|------------|-------------|
| **ButtonComponent** | Botones con variantes (primary, outline, ghost), tamaños y estados |
| **InputComponent** | Campos con iconos, etiquetas y validación |
| **NavbarComponent** | Navegación con glassmorphism y diseño responsivo |
| **FooterComponent** | Pie de página con selector de idioma |
| **AvatarComponent** | Representación de usuarios |
| **SearchBarComponent** | Búsqueda con debounce |
| **EventCardComponent** | Tarjetas de eventos con estado y capacidad |
| **ModalComponent** | Ventanas modales reutilizables |
| **ToastComponent** | Notificaciones temporales |

---

## Configuración

### Variables de Entorno

Crea `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

### Dependencias

```bash
npm install
```

---

## Desarrollo

### Servidor de Desarrollo

```bash
npm start
# Disponible en http://localhost:4200
```

### Build de Producción

```bash
npm run build
# Los archivos se generan en dist/
```

### Linting

```bash
npm run lint
```

---

## Internacionalización

El sistema usa **Transloco** para multi-idioma.

### Archivos de Traducción

| Idioma | Archivo |
|--------|---------|
| Español | `public/assets/i18n/es.json` |
| Inglés | `public/assets/i18n/en.json` |

### Uso en Componentes

```typescript
import { TranslocoService } from '@ngneat/transloco';

constructor(private transloco: TranslocoService) {}

changeLanguage(lang: string) {
  this.transloco.setActiveLang(lang);
}

// En template
{{ 'key.translation' | transloco }}
```

---

## Testing

```bash
# Todas las pruebas
npm test

# Modo watch
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Coverage

El reporte de coverage se genera automáticamente durante el build de Docker:

```bash
# Construir contenedor
docker-compose up --build

# Ver reporte
# reports/coverage/
```

---

## Roles y Permisos

| Rol | Descripción |
|-----|-------------|
| **Admin** | Panel de administración, gestión completa |
| **Organizador** | Dashboard de organizador, crear/gestionar eventos |
| **Asistente** | Explorar eventos, inscribirse, ver calendario personal |

### Rutas Protegidas

- `/admin/*` - Solo Admin
- `/organizer/*` - Admin y Organizador
- `/events/*` - Todos los roles autenticados
- `/auth/*` - Público
