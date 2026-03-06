import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { EventStore } from '@core/application/store/event.store';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const eventStore = inject(EventStore);
  const isAuthRequest = req.url.includes('/auth/');

  if (!isAuthRequest) {
    eventStore.setLoading(true);
  }

  return next(req).pipe(
    finalize(() => {
      if (!isAuthRequest) {
        eventStore.setLoading(false);
      }
    })
  );
};
