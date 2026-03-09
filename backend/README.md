# Mis Eventos - Backend

Sistema de gestión de eventos construido bajo Arquitectura Hexagonal (Puertos y Adaptadores) con principios SOLID.

---

## Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [API Endpoints](#api-endpoints)
- [Reglas de Negocio](#reglas-de-negocio)
- [Configuración](#configuración)
- [Despliegue con Docker](#despliegue-con-docker)
- [Desarrollo Local](#desarrollo-local)
- [Testing](#testing)
- [Linting](#linting)

---

## Tecnologías

| Tecnología | Propósito |
|------------|-----------|
| **Python 3.12** | Lenguaje principal |
| **FastAPI** | Framework web de alto rendimiento |
| **SQLModel** | ORM basado en SQLAlchemy y Pydantic |
| **PostgreSQL** | Base de datos relacional |
| **Redis** | Caché de alto rendimiento |
| **Pillow** | Procesamiento de imágenes |
| **Alembic** | Migraciones de base de datos |
| **Poetry** | Gestión de dependencias |
| **JWT** | Autenticación |

---

## Arquitectura

El proyecto sigue el patrón de **Puertos y Adaptadores (Hexagonal)** para garantizar desacoplamiento entre lógica de negocio e infraestructura.

```
backend/app/
├── domain/                    # Entidades puras y reglas de negocio
│   ├── entities/             # User, Event, Session, Registration
│   └── exceptions/           # Excepciones de dominio
├── application/              # Orquestación de casos de uso
│   ├── use_cases/            # Lógica de negocio
│   ├── ports/                # Interfaces/abstracciones
│   ├── dto/                  # Objetos de transferencia
│   └── serializers/         # Serialización de caché
└── infrastructure/           # Adaptadores externos
    ├── api/                  # FastAPI (routers, controllers, security)
    ├── database/             # SQLModel (models, repositories)
    ├── services/             # Storage, Cache, Hashing
    └── config/               # Configuración
```

---

## API Endpoints

### Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/register` | Registro de usuarios (Asistente/Organizador) |
| `POST` | `/auth/login` | Login, retorna token JWT |

### Eventos (`/events`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/events/` | Listar eventos (búsqueda, paginación) |
| `POST` | `/events/` | Crear evento (Organizador/Admin) |
| `GET` | `/events/{id}` | Detalle del evento |
| `PUT` | `/events/{id}` | Actualizar evento |
| `DELETE` | `/events/{id}` | Eliminar evento |
| `POST` | `/events/{id}/image` | Subir imagen del evento |

### Sesiones (`/sessions`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/sessions/event/{event_id}` | Sesiones de un evento |
| `POST` | `/sessions/` | Crear sesión |
| `PUT` | `/sessions/{id}` | Actualizar sesión |
| `DELETE` | `/sessions/{id}` | Eliminar sesión |

### Inscripciones (`/registrations`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/registrations/` | Inscribirse a evento |
| `DELETE` | `/registrations/event/{id}` | Cancelar inscripción |
| `GET` | `/registrations/user/{id}` | Inscripciones del usuario |

### Inscripciones a Sesiones (`/session-registrations`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/session-registrations/` | Inscribirse a sesión |
| `DELETE` | `/session-registrations/{id}` | Cancelar inscripción |

### Usuarios (`/users`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/users/` | Listar usuarios (Admin) |
| `GET` | `/users/{id}` | Obtener usuario |

> **Documentación interactiva**: http://localhost:8000/docs

---

## Reglas de Negocio

1. **Restricción de Admin**: Los administradores no pueden inscribirse a eventos o sesiones
2. **Control de Capacidad**: Validación de cupos disponibles en tiempo real
3. **Estado del Evento**: Solo eventos en estado **Publicado** permiten inscripciones

---

## Configuración

### Variables de Entorno (.env)

```env
# App
APP_NAME="Mis Eventos API"
DEBUG=True

# Database & Cache
DATABASE_URL=postgresql://root:rootpassword@db:5432/mis_eventos
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=tu_llave_secreta_jwt
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
CORS_ORIGINS=http://localhost:4200

# Admin (seed)
DEFAULT_ADMIN_EMAIL=admin@gmail.com
DEFAULT_ADMIN_PASSWORD=Password123!
```

---

## Despliegue con Docker

### Inicio Rápido

```bash
# 1. Construir e iniciar servicios
docker-compose up --build -d
```

> Las migraciones y el usuario admin se crean automáticamente.

### Gestión de Migraciones

```bash
# Nueva migración
docker compose exec backend alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
docker compose exec backend alembic upgrade head

# Rollback
docker compose exec backend alembic downgrade -1
```

### Comandos Útiles

```bash
# Ver logs
docker-compose logs -f backend

# Reiniciar servicio
docker-compose restart backend

# Acceder al contenedor
docker-compose exec backend bash
```

---

## Desarrollo Local

### Requisitos

- Python 3.12
- PostgreSQL (puede usar el de Docker)
- Redis

### Instalación

```bash
cd backend
poetry install

# Copiar configuración
cp .env.example .env
```

### Ejecución

```bash
# Iniciar servidor
poetry run uvicorn app.infrastructure.api.main:app --reload

# O directamente
poetry run python -m uvicorn app.infrastructure.api.main:app --reload
```

### Crear Admin

```bash
poetry run python -m app.scripts.seed_admin
```

---

## Testing

```bash
# Todas las pruebas
docker compose exec backend pytest

# Con coverage
docker compose exec backend pytest --cov=app --cov-report=term-missing

# Pruebas unitarias
docker compose exec backend pytest tests/unit

# Pruebas de integración
docker compose exec backend pytest tests/integration

# Archivo específico
docker compose exec backend pytest tests/unit/test_event_service.py
```

### Coverage

El reporte de coverage se genera automáticamente durante el build de Docker:

```bash
# Construir contenedor
docker-compose up --build

# Ver reporte HTML
# reports/coverage-backend/index.html
```

---

## Linting

```bash
# Verificar y corregir
docker compose exec backend ruff check . --fix

# Formatear código
docker compose exec backend ruff format .
```

---

## Validación del Sistema

1. Acceder a http://localhost:8000/docs
2. Login con: `admin@gmail.com` / `Password123!`
3. Autorizar con el token JWT
4. Probar funcionalidades:
   - Crear evento como Organizador
   - Registrarse como Asistente
   - Subir imagen y verificar versiones optimizadas
