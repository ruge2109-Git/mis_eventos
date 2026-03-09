# Rutas de la Aplicación Frontend

Este documento lista todas las rutas disponibles en la aplicación Angular "Mis Eventos".
La aplicación utiliza componentes "lazy-loaded" (carga perezosa) para optimizar el rendimiento.

## 1. Auth (Autenticación)
- `/auth/login`: Página inicio de sesión (Login/Register usando `AuthComponent`).
- `/auth/register`: Página de registro (Login/Register usando `AuthComponent`).

## 2. Pistas Públicas e Invitados (Main Layout)
Componente de Layout: `MainLayoutComponent`

- `/`: Lista de eventos principales (`EventListComponent`).
- `/evento/:id`: Detalles de un evento específico (`EventDetailComponent`).

## 3. Asistente (Main Layout)
Rutas anidadas bajo `/asistente`. Componente de Layout: `MainLayoutComponent`.

- `/asistente`: Dashboard del asistente (`AssistantDashboardComponent`).
- `/asistente/mis-eventos`: Mis eventos como asistente (`MyEventsComponent`).
- `/asistente/calendario`: Calendario del asistente (`AssistantCalendarComponent`).

## 4. Organizador (Organizer Layout)
Rutas protegidas por `organizerGuard`. Componente de Layout: `OrganizerLayoutComponent`.

- `/dashboard/organizer`: Dashboard principal del organizador (`OrganizerDashboardComponent`).
- `/dashboard/organizer/crear`: Creador de un nuevo evento (`EventCreateComponent`).
- `/dashboard/organizer/evento/:id`: Edición de un evento creado por el organizador (`EventCreateComponent`).
- `/dashboard/organizer/calendario`: Calendario del organizador (`CalendarPageComponent`).

## 5. Administrador (Admin Layout)
Rutas protegidas por `adminGuard`. Componente de Layout: `AdminLayoutComponent`.

- `/admin`: Dashboard del administrador (`AdminDashboardComponent`).
- `/admin/eventos`: Gestión general de eventos (`AdminEventsComponent`).
- `/admin/eventos/evento/:id`: Edición de evento desde el administrador (`EventCreateComponent`).
- `/admin/perfiles`: Gestión de perfiles de usuario (`AdminProfilesComponent`).

## 6. Rutas de Comodín (Wildcard)
- `**`: Redirecciona a la ruta raíz `/` para manejar URLs no encontradas (404).

---

*Nota: La estructura de rutas está configurada en `src/app/app.routes.ts`.*
