import { Injectable, inject } from '@angular/core';
import { EventRepository } from '../../domain/ports/event.repository';
import { EventStore } from '../store/event.store';
import { finalize, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GetEventsUseCase {
  private repository = inject(EventRepository);
  private store = inject(EventStore);

  execute(skip: number = 0, limit: number = 12, append: boolean = false) {
    this.store.setLoading(true);
    
    return this.repository.getAll(skip, limit).pipe(
      tap({
        next: (response) => {
          if (append) {
            this.store.appendEvents(response.items, response.total);
          } else {
            this.store.setEvents(response.items, response.total);
          }
        },
        error: (err) => this.store.setError(err.message || 'Error fetching events')
      }),
      finalize(() => this.store.setLoading(false))
    );
  }
}
