import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/layouts/main-layout/main-layout.component').then(m => m.MainLayout),
    children: [
      { 
        path: '', 
        loadComponent: () => import('./presentation/pages/events/event-list/event-list.component').then(m => m.EventListComponent) 
      },
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
