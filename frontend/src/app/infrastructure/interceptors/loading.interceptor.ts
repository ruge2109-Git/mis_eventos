import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { EventStore } from '../../core/application/store/event.store';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const eventStore = inject(EventStore);
  
  eventStore.setLoading(true);

  return next(req).pipe(
    finalize(() => {
      eventStore.setLoading(false);
    })
  );
};
