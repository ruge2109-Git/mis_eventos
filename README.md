# Mis Eventos

Plataforma integral de gestión de eventos estructurada bajo una arquitectura cliente-servidor. Permite a los organizadores crear y administrar eventos, y a los asistentes explorar e inscribirse en ellos.

## Arquitectura General

El proyecto está dividido en dos aplicaciones principales que se comunican a través de una API RESTful:

- **Frontend:** Aplicación SPA (Single Page Application) construida con Angular 21, TypeScript y Tailwind CSS. Sigue principios de Clean Architecture.
- **Backend:** API de alto rendimiento construida con FastAPI (Python), SQLModel, PostgreSQL y Redis para caché. Implementa Arquitectura Hexagonal.

```plaintext
mis_eventos/
├── backend/               # Lógica de negocio, base de datos y API
│   └── README.md          # Detalles de arquitectura del backend
├── frontend/              # Interfaz de usuario y cliente web
│   └── README.md          # Detalles de arquitectura del frontend
└── docker-compose.yml     # Orquestación de infraestructura
```

## Ejecución del Proyecto (Docker)

La forma más rápida de levantar toda la infraestructura del proyecto es utilizando Docker y Docker Compose.

### Prerrequisitos
- Docker y Docker Compose instalados.

### Pasos para ejecutar

1. Clona el repositorio y ubícate en la raíz del proyecto.
2. Construye y levanta los servicios:
   ```bash
   docker-compose up --build
   ```
   > **Nota:** Al iniciar, los contenedores ejecutarán automáticamente las pruebas de cobertura y las migraciones de base de datos antes de activar los servicios.
3. Los servicios estarán disponibles en:
   - **Frontend:** [http://localhost:4200](http://localhost:4200)
   - **Backend API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Base de Datos (PostgreSQL):** `localhost:5432`
   - **Caché (Redis):** `localhost:6379`

### Automatización y Reportes

Al levantar el proyecto con Docker, se ejecutan automáticamente:
- **Migraciones:** La base de datos se actualiza a la última versión y se siembra el usuario admin (`admin@gmail.com` / `Password123!`).
- **Coverage:** Se generan reportes de pruebas en la carpeta raíz `./reports/`.

#### Cómo ver los reportes en tu navegador:
1. Navega en tu explorador de archivos a la carpeta raíz del proyecto.
2. Abre la carpeta `reports/`.
3. Para el **Backend**, abre el archivo `coverage-backend/index.html`.
4. Para el **Frontend**, abre el archivo `coverage-frontend/index.html`.


### Tiempos de Construcción y Arranque

Tiempos estimados en despliegue con Docker:

| Fase | Tiempo Estimado | Detalle |
|------|-----------------|---------|
| **Build inicial** | 8 ~ 12 minutos | Descarga de imágenes base e instalación de dependencias (Poetry/NPM). |
| **Re-build (Caché)** | < 1 minuto | Copia de código fuente tras cambios simples sin nuevas librerías. |
| **Startup (Arranque)** | 1 ~ 2 minutos | Tiempo tras `docker-compose up` donde se ejecutan tests y migraciones antes de activar los servidores. |

---
Para detalles específicos de desarrollo local, revisa la documentación de cada servicio:
- [Documentación del Backend](backend/README.md)
- [Documentación del Frontend](frontend/README.md)
