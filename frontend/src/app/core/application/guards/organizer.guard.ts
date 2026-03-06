import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@core/application/store/auth.store';

export const organizerGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const role = authStore.userRole();
  if (role !== 'Organizer' && role !== 'Admin') {
    router.navigate(['/']);
    return false;
  }

  return true;
};
