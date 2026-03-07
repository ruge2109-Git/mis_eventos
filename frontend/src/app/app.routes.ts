import { Routes } from '@angular/router';
import { organizerGuard } from './core/application/guards/organizer.guard';
import { adminGuard } from './core/application/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./presentation/layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./presentation/pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'eventos',
        loadComponent: () => import('./presentation/pages/admin/admin-events/admin-events.component').then(m => m.AdminEventsComponent)
      },
      {
        path: 'eventos/evento/:id',
        loadComponent: () => import('./presentation/pages/events/event-create/event-create.component').then(m => m.EventCreateComponent)
      },
      {
        path: 'perfiles',
        loadComponent: () => import('./presentation/pages/admin/admin-profiles/admin-profiles.component').then(m => m.AdminProfilesComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./presentation/layouts/main-layout/main-layout.component').then(m => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./presentation/pages/events/event-list/event-list.component').then(m => m.EventListComponent)
      },
      {
        path: 'evento/:id',
        loadComponent: () => import('./presentation/pages/events/event-detail/event-detail.component').then(m => m.EventDetailComponent)
      },
      {
        path: 'asistente',
        children: [
          {
            path: '',
            loadComponent: () => import('./presentation/pages/dashboard/assistant-dashboard/assistant-dashboard.component').then(m => m.AssistantDashboardComponent)
          },
          {
            path: 'mis-eventos',
            loadComponent: () => import('./presentation/pages/assistant/my-events/my-events.component').then(m => m.MyEventsComponent)
          },
          {
            path: 'calendario',
            loadComponent: () => import('./presentation/pages/assistant/assistant-calendar/assistant-calendar.component').then(m => m.AssistantCalendarComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'dashboard/organizer',
    canActivate: [organizerGuard],
    loadComponent: () => import('./presentation/layouts/organizer-layout/organizer-layout.component').then(m => m.OrganizerLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./presentation/pages/dashboard/organizer-dashboard/organizer-dashboard.component').then(m => m.OrganizerDashboardComponent)
      },
      {
        path: 'crear',
        loadComponent: () => import('./presentation/pages/events/event-create/event-create.component').then(m => m.EventCreateComponent)
      },
      {
        path: 'evento/:id',
        loadComponent: () => import('./presentation/pages/events/event-create/event-create.component').then(m => m.EventCreateComponent)
      },
      {
        path: 'calendario',
        loadComponent: () => import('./presentation/pages/dashboard/calendar/calendar-page.component').then(m => m.CalendarPageComponent)
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./presentation/pages/auth/auth/auth.component').then(m => m.AuthComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./presentation/pages/auth/auth/auth.component').then(m => m.AuthComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
