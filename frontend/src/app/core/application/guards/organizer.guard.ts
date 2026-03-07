import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@core/application/store/auth.store';
import { canAccessOrganizerDashboard } from '@core/domain/constants/user-role';

export const organizerGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
    return false;
  }

  if (!canAccessOrganizerDashboard(authStore.userRole())) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
