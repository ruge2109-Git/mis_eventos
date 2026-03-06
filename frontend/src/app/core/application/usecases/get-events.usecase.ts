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

  execute() {
    this.store.setLoading(true);
    
    return this.repository.getAll().pipe(
      tap({
        next: (events) => this.store.setEvents(events),
        error: (err) => this.store.setError(err.message || 'Error fetching events')
      }),
      finalize(() => this.store.setLoading(false))
    );
  }
}
