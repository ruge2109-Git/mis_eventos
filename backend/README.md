# Mis Eventos - Backend

Sistema de gestión de eventos construido bajo Arquitectura Hexagonal y siguiendo los principios SOLID.

---

## Tecnologías Core

- **Python 3.12**
- **FastAPI**: Framework web de alto rendimiento.
- **SQLModel**: ORM basado en SQLAlchemy y Pydantic.
- **PostgreSQL**: Base de datos relacional.
- **Redis**: Capa de caching de alto rendimiento.
- **Pillow**: Procesamiento y optimización de imágenes.
- **Alembic**: Gestión de migraciones de base de datos.
- **Poetry**: Gestión de dependencias y empaquetado.

---

## Documentación de la API

La API está documentada interactivamente con Swagger. Puede acceder en:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Resumen de Endpoints Principales

#### Autenticación (/auth)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Registro de nuevos usuarios (Asistentes y Organizadores). |
| `POST` | `/auth/login` | Login de usuarios. Retorna el token JWT. |

#### Eventos (/events)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/events/` | Lista todos los eventos (soporta búsqueda y paginación). |
| `POST` | `/events/` | Crea un nuevo evento. (Requiere rol de Organizador/Admin). |
| `GET` | `/events/{id}` | Obtiene el detalle completo de un evento. |
| `POST` | `/events/{id}/image` | Sube y optimiza la imagen del evento. |

#### Sesiones y Actividades (/sessions)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/sessions/event/{event_id}` | Lista todas las sesiones de un evento específico. |
| `POST` | `/sessions/` | Crea una actividad dentro de un evento. |

#### Inscripciones (/registrations)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/registrations/` | Inscribe al usuario autenticado en un evento. |
| `DELETE` | `/registrations/event/{id}` | Cancela la inscripción a un evento. |
| `GET` | `/registrations/user/{id}` | Lista todos los eventos a los que un usuario se ha inscrito. |

#### Inscripciones a Sesiones (/session-registrations)
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/session-registrations/` | Inscribe al usuario en un taller o sesión específica. |
| `DELETE` | `/session-registrations/{id}` | Cancela la inscripción a una sesión. |

---

## Reglas de Negocio Específicas

Para garantizar la integridad del sistema y el flujo esperado, se han implementado las siguientes reglas:

1. **Restricción de Administradores**: Los usuarios con el rol de Administrador tienen prohibido inscribirse a eventos o sesiones individuales. Su función es exclusivamente de gestión y supervisión.
2. **Dependencia de Inscripción**: Un usuario asistente debe estar inscrito obligatoriamente en el evento principal antes de poder inscribirse a cualquier sesión o taller específico de dicho evento.
3. **Control de Capacidad**: Tanto los eventos como las sesiones validan la disponibilidad de cupos en tiempo real antes de confirmar una inscripción.
4. **Validación de Estados**: Solo es posible inscribirse en eventos que se encuentren en estado **Publicado**.

---

## Arquitectura del Proyecto

El proyecto sigue el patrón de Puertos y Adaptadores (Hexagonal) para garantizar un desacoplamiento total entre la lógica de negocio y la infraestructura externa.

### Estructura de Carpetas

```text
backend/app/
├── domain/                # Capa de Dominio: Entidades puras y reglas de negocio
│   ├── entities/          # User, Event, Session, Registration (Python puro)
│   └── exceptions/        # Excepciones de dominio personalizadas
├── application/           # Capa de Aplicación: Orquestación
│   ├── use_cases/         # Lógica de los casos de uso (Auth, CRUD, Registro)
│   └── ports/             # Interfaces (Abstract Base Classes) para infraestructura
└── infrastructure/        # Capa de Infraestructura: Adaptadores externos
    ├── api/               # Entrada HTTP (FastAPI)
    │   ├── routers/       # Definición de rutas y endpoints
    │   ├── controllers/   # Orquestadores de API (Delegan a Use Cases)
    │   ├── dependencies/  # Inyección de dependencias y proveedores
    │   └── security/      # Manejo de JWT y Hashing de contraseñas
    ├── database/          # Persistencia (SQLModel)
    │   ├── models/        # Modelos de tablas (separados de entidades de dominio)
    │   └── repositories/  # Implementaciones concretas de los Puertos
    ├── services/          # Servicios externos (Almacenamiento, Caché)
    └── config/            # Configuraciones globales (DB, Env, Settings)
```

---

## Soporte de Medios y Optimización

- **Formato WebP**: Conversión automática para optimizar el rendimiento de carga.
- **Imagen Responsive**: Generación automática de versiones optimizadas (1200px) y miniaturas (400px) por cada subida.
- **Persistencia**: Uso de volúmenes de Docker para asegurar que los archivos multimedia persistan tras reinicios de contenedores.

---

## Caching

- **Redis Integration**: Implementación de caché para listados de eventos y detalles individuales.
- **Invalidación Automática**: Purgado de caché activado por eventos de escritura (creación, edición, subida de imágenes) para garantizar consistencia.

---

## Instalación y Configuración

### Configuración de Entorno (.env)
Guarde un archivo `.env` en el directorio `backend/` con las siguientes variables básicas:

```env
# App Configuration
APP_NAME="Mis Eventos API"
DEBUG=True

# Database & Cache
DATABASE_URL=postgresql://root:rootpassword@db:5432/mis_eventos
REDIS_URL=redis://redis:6379/0

# Default Admin (Seed)
DEFAULT_ADMIN_EMAIL=admin@gmail.com
DEFAULT_ADMIN_PASSWORD=Password123!

# Security
SECRET_KEY=tu_llave_secreta_para_jwt
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Guía de Despliegue con Docker

Siga estos pasos para poner en marcha el entorno completo:

### 1. Configuración de Entorno
Cree el archivo `.env` en la carpeta `backend/` con las variables necesarias. Asegúrese de que `DATABASE_URL` y `REDIS_URL` apunten a los nombres de los servicios de Docker (ej. `db` y `redis`).

### 2. Inicio de Contenedores
Desde la raíz del proyecto, construya e inicie los servicios:
```bash
docker-compose up --build -d
```

### 3. Inicialización de la Base de Datos
Es necesario ejecutar las migraciones una vez que el contenedor de la base de datos esté listo:
```bash
docker compose exec backend alembic upgrade head
```

### 4. Gestión de Cambios (Opcional)
Para generar nuevas migraciones tras modificar modelos:
```bash
docker compose exec backend alembic revision --autogenerate -m "Descripción"
```

---

## Primeros pasos y Pruebas

Para validar el funcionamiento del backend una vez que los contenedores estén activos:

1. **Acceso**: Diríjase a `http://localhost:8000/docs`.
2. **Autenticación Inicial**:
   - Localice el endpoint `POST /auth/login`.
   - Utilice las credenciales por defecto (configuradas en su `.env`):
     - **Email**: `admin@gmail.com`
     - **Password**: `Password123!`
3. **Autorización**:
   - Copie el `access_token` recibido en la respuesta del login.
   - Haga clic en el botón **Authorize** (candado) arriba a la derecha.
   - Pegué el token. El sistema usará el esquema Bearer automáticamente.
4. **Pruebas de Reglas y Funcionalidades**:
   - **Registro Protegido**: Intente registrarse como `Admin` en `POST /auth/register` para confirmar el error 403.
   - **Imágenes**: Suba una imagen en `POST /events/{id}/image` y verifique que se generen las versiones optimizadas en la carpeta `uploads/`.
   - **Caché**: Realice búsquedas de eventos y observe la velocidad de respuesta en llamadas subsecuentes gracias a Redis.
