import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { EventStore } from '@core/application/store/event.store';
import { LoadingContextService } from '@core/application/services/loading-context.service';

const EVENTS_CONTEXT = 'events';

function isEventsRequestUrl(url: string): boolean {
  return url.includes('event');
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const eventStore = inject(EventStore);
  const loadingContext = inject(LoadingContextService);
  const isAuthRequest = req.url.includes('/auth/');
  const isSessionsRequest = req.url.includes('/sessions/');
  const isEvents = isEventsRequestUrl(req.url);
  const useEventsContext = !isAuthRequest && !isSessionsRequest && isEvents;
  const useEventStore = !isAuthRequest && !isSessionsRequest && !isEvents;

  if (useEventsContext) {
    loadingContext.setLoading(EVENTS_CONTEXT, true);
  } else if (useEventStore) {
    eventStore.setLoading(true);
  }

  return next(req).pipe(
    finalize(() => {
      if (useEventsContext) {
        loadingContext.setLoading(EVENTS_CONTEXT, false);
      } else if (useEventStore) {
        eventStore.setLoading(false);
      }
    })
  );
};
