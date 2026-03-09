# Mis Eventos

Plataforma completa de gestión de eventos que permite a los usuarios crear, publicar y registrarse en eventos y sesiones/actividades.

---

## Acerca del Proyecto

**Mis Eventos** es una aplicación full-stack diseñada para la gestión integral de eventos. Permite a los organizadores crear y administrar eventos con múltiples sesiones, mientras que los asistentes pueden explorar, buscar y registrarse en eventos de su interés.

### Características Principales

- **Gestión de Eventos**: Creación, edición y publicación de eventos con imágenes optimizadas
- **Sistema de Sesiones**: Actividades y talleres dentro de cada evento
- **Registro de Asistencia**: Inscripción a eventos y sesiones con control de capacidad
- **Roles de Usuario**: Administrador, Organizador y Asistente
- **Búsqueda y Filtrado**: Exploración de eventos con paginación
- **Multi-idioma**: Soporte para Español e Inglés
- **Cache de Alto Rendimiento**: Optimización con Redis

---

## Tecnologías

### Backend

| Tecnología | Propósito |
|------------|-----------|
| Python 3.12 | Lenguaje principal |
| FastAPI | Framework web |
| SQLModel | ORM híbrido |
| PostgreSQL | Base de datos |
| Redis | Caché |
| Alembic | Migraciones |
| Pillow | Procesamiento de imágenes |

### Frontend

| Tecnología | Propósito |
|------------|-----------|
| Angular 21 | Framework frontend |
| TypeScript | Lenguaje tipado |
| Tailwind CSS | Estilos |
| RxJS | Programación reactiva |
| Transloco | Internacionalización |

### Infraestructura

| Servicio | Puerto |
|----------|--------|
| PostgreSQL | 5432 |
| Redis | 6379 |
| FastAPI | 8000 |
| Angular | 4200 |

---

## Estructura del Proyecto

```
mis_eventos/
├── docker-compose.yml     # Orquestación de servicios
├── backend/               # API REST (FastAPI)
│   ├── app/              # Código fuente
│   ├── Dockerfile        # Imagen del contenedor
│   └── README.md         # Documentación del backend
└── frontend/             # Cliente web (Angular)
    ├── src/              # Código fuente
    ├── Dockerfile        # Imagen del contenedor
    └── README.md         # Documentación del frontend
```

---

## Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local del frontend)
- Python 3.12+ (para desarrollo local del backend)

### Configuración con Docker

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd mis_eventos
   ```

2. **Iniciar los servicios**
   ```bash
   docker-compose up --build -d
   ```

3. **Verificar servicios**
   - Frontend: http://localhost:4200
   - API: http://localhost:8000/docs
   - Redis: localhost:6379

4. **Configurar la base de datos**
   ```bash
   # Ejecutar migraciones
   docker-compose exec backend alembic upgrade head

   # Crear usuario administrador
   docker-compose exec backend python -m app.scripts.seed_admin
   ```

5. **Credenciales por defecto**
   - Email: `admin@gmail.com`
   - Password: `Password123!`

### Desarrollo Local

**Backend:**
```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run python -m app.scripts.seed_admin
poetry run uvicorn app.infrastructure.api.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Admin** | Gestión completa, visualización de estadísticas, no puede inscribirse |
| **Organizador** | Crear y administrar sus propios eventos |
| **Asistente** | Explorar, inscribirse a eventos y sesiones |

---

## Documentación Detallada

- [README del Backend](backend/README.md) - Arquitectura hexagonal, API endpoints, reglas de negocio
- [README del Frontend](frontend/README.md) - Componentes, servicios, configuración de i18n

---

## Reportes de Coverage

Los reportes de coverage se generan automáticamente durante el build de Docker:

```bash
# Construir contenedor (genera coverage automáticamente)
docker-compose up --build

# Ver reportes
ls reports/
```

### Backend (pytest)
- Ubicación: `reports/coverage-backend/index.html`
- Generado por: `pytest --cov=app`

### Frontend (Vitest)
- Ubicación: `reports/coverage/`
- Generado por: `npm run test:coverage`

---

## Licencia

MIT
