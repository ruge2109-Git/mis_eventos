import { Routes } from '@angular/router';
import { organizerGuard } from './core/application/guards/organizer.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/layouts/main-layout/main-layout.component').then(m => m.MainLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./presentation/pages/events/event-list/event-list.component').then(m => m.EventListComponent)
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
