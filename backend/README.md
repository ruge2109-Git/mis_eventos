# Mis Eventos - Backend

API RESTful de alto rendimiento para la gestión de eventos, desarrollada con **Python 3.12** y **FastAPI**. 

## Arquitectura y Patrones

El backend implementa **Arquitectura Hexagonal (Puertos y Adaptadores)**, lo que permite un desacoplamiento total entre la lógica de negocio y las dependencias externas.

### Patrones Implementados:
- **SOLID:** Aplicados en todas las capas para facilitar la extensión y el mantenimiento.
- **Repository Pattern:** Abstracción del acceso a datos a través de puertos.
- **Dependency Injection:** Gestión de dependencias nativa de FastAPI.
- **DTOs & Mappers:** Uso de Pydantic y SQLModel para la validación y transformación de datos.

```plaintext
backend/app/
├── domain/            # Entidades puras y excepciones de negocio
├── application/       # Puertos (interfaces), DTOs y lógica de Casos de Uso
└── infrastructure/    # Adaptadores (API, Repositorios SQL, Hashing, Auth)
```

## Documentación de la API

El sistema utiliza **Swagger/OpenAPI** para documentar todos los endpoints de forma interactiva.

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Infraestructura Técnica
- **Motor:** FastAPI + Python 3.12.
- **Persistencia:** PostgreSQL con **SQLModel** (basado en SQLAlchemy).
- **Caché:** Redis para optimización de consultas recurrentes.
- **Migraciones:** Gestión de versiones de BD con **Alembic**.

## Scripts y Ejecución Local

Para el desarrollo local se utiliza **Poetry** como gestor de dependencias.

### Prerrequisitos
- Python 3.12
- Instancias de PostgreSQL y Redis en ejecución (pueden ser las de Docker).

### Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   cd backend
   poetry install
   ```

2. **Configurar el entorno:**
   Copia las variables de entorno para desarrollo.
   ```bash
   cp .env.example .env
   ```

3. **Migraciones:**
   ```bash
   poetry run alembic upgrade head
   ```

4. **Levantar el servidor:**
   ```bash
   poetry run uvicorn app.infrastructure.api.main:app --reload
   ```
   > La API estará expuesta y documentada en `http://localhost:8000/docs`

### Testing y Calidad

El backend cuenta con una completa suite de pruebas automatizadas:

```bash
# Ejecución local con Poetry
poetry run pytest --cov=app

# Ejecución de pruebas mediante Docker
docker compose exec backend pytest --cov=app --cov-report=term-missing
```