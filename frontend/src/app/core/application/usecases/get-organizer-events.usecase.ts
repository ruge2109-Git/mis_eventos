import { Injectable, inject } from '@angular/core';
import { EventRepository } from '@core/domain/ports/event.repository';
import { EventStore } from '@core/application/store/event.store';
import { finalize, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GetOrganizerEventsUseCase {
  private repository = inject(EventRepository);
  private store = inject(EventStore);

  execute(skip: number = 0, limit: number = 12, search?: string, append: boolean = false) {
    this.store.setLoading(true);

    return this.repository.getMine(skip, limit, search).pipe(
      tap({
        next: (response) => {
          if (append) {
            this.store.appendEvents(response.items, response.total);
          } else {
            this.store.setEvents(response.items, response.total);
          }
        },
        error: (err) => this.store.setError(err?.error?.detail ?? err?.message ?? 'Error al cargar tus eventos')
      }),
      finalize(() => this.store.setLoading(false))
    );
  }
}
