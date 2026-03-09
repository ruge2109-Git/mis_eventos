# Mis Eventos - Backend

API REST para la plataforma Mis Eventos, construida con FastAPI y organizada con arquitectura hexagonal para aislar reglas de negocio de infraestructura.

## Objetivo del servicio

Este backend expone las capacidades de:

- autenticacion y autorizacion por rol,
- gestion de eventos y sus estados,
- gestion de sesiones por evento,
- inscripciones a eventos y sesiones,
- operaciones administrativas.

## Arquitectura

### Enfoque

El codigo sigue un modelo de puertos y adaptadores:

- `domain`: entidades y reglas de negocio puras (sin dependencias de framework),
- `application`: casos de uso y contratos (`ports`) que definen lo que el dominio necesita,
- `infrastructure`: implementaciones concretas (HTTP, base de datos, cache, storage, seguridad).

### Estructura principal

```plaintext
backend/
├── app/
│   ├── domain/
│   │   ├── entities/                # Modelos de negocio (Event, User, Session, etc.)
│   │   └── exceptions/              # Errores de dominio
│   ├── application/
│   │   ├── use_cases/               # Orquestacion de reglas de negocio
│   │   ├── ports/                   # Contratos de repositorios/servicios externos
│   │   ├── dto/                     # Objetos para intercambio entre capas
│   │   └── serializers/
│   └── infrastructure/
│       ├── api/                     # Routers, schemas, controllers, dependencias
│       ├── database/                # Modelos SQLModel y repositorios Postgres
│       ├── services/                # Redis, hashing, storage local, politicas de cache
│       └── config/                  # Settings y conexion a BD
├── alembic/                         # Migraciones
└── tests/                           # Unitarias e integracion
```

### Flujo de una peticion

1. Un `router` de FastAPI recibe la solicitud y valida payload/query.
2. El `provider` inyecta el controlador y sus dependencias concretas.
3. El controlador delega al caso de uso correspondiente.
4. El caso de uso opera contra `ports` (repositorio/cache/storage), no contra implementaciones concretas.
5. Los adaptadores de `infrastructure` materializan acceso a Postgres, Redis, filesystem o JWT.
6. La respuesta se mapea a schema HTTP y se retorna al cliente.

## Capas tecnicas relevantes

### API y seguridad

- Framework: FastAPI.
- Auth: JWT (`Authorization: Bearer ...`) con expiracion configurable.
- Control por rol: dependencias reutilizables (`RequireAdmin`, `RequireOrganizer`, `RequireAuthenticated`).
- Manejo de errores: middlewares/handlers para errores de dominio y errores globales.

### Persistencia y cache

- Base de datos: PostgreSQL, acceso con SQLModel/SQLAlchemy.
- Migraciones: Alembic.
- Cache: Redis para lecturas de eventos; fallback a servicio `NoOp` cuando Redis no esta disponible.
- Storage: servicio local para imagenes de eventos (`uploads`) servido por FastAPI como archivos estaticos.

## Configuracion

### Variables de entorno

Se cargan desde `backend/.env` mediante `pydantic-settings`.

Pasos recomendados:

```bash
cd backend
cp .env.example .env
```

Variables clave:

- `DATABASE_URL`
- `SECRET_KEY`
- `REDIS_URL`
- `CORS_ORIGINS`
- `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`

## Ejecucion local

### Requisitos

- Python 3.12
- Poetry
- PostgreSQL y Redis activos (local o por Docker)

### Instalacion y arranque

```bash
cd backend
poetry install
cp .env.example .env
poetry run alembic upgrade head
poetry run uvicorn app.infrastructure.api.main:app --reload
```

Documentacion interactiva:

- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Calidad y pruebas

### Suite de pruebas

- Unitarias y de integracion bajo `tests/`.
- Configuracion de `pytest` y cobertura definida en `pyproject.toml`.

Comandos:

```bash
cd backend
poetry run pytest
```

```bash
cd backend
poetry run pytest --cov=app --cov-report=term-missing
```

### Lint y formato

Ruff esta configurado como linter/formateador en `pyproject.toml`.

```bash
cd backend
poetry run ruff check .
poetry run ruff format .
```

## Criterios de extensibilidad

Para agregar nueva funcionalidad:

1. Define o ajusta entidades/reglas en `domain`.
2. Crea el caso de uso en `application/use_cases`.
3. Agrega/actualiza contratos en `application/ports` si hay nuevas dependencias.
4. Implementa adaptadores concretos en `infrastructure`.
5. Expone endpoints en `infrastructure/api/routers`.
6. Agrega pruebas unitarias e integracion.

Este orden evita acoplar negocio a detalles de framework o almacenamiento.
