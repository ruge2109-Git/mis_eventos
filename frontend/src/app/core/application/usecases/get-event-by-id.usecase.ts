import { Injectable, inject } from '@angular/core';
import { EventRepository } from '../../domain/ports/event.repository';
import { EventStore } from '../store/event.store';
import { finalize, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GetEventByIdUseCase {
  private repository = inject(EventRepository);
  private store = inject(EventStore);

  execute(id: string) {
    this.store.setLoading(true);
    this.store.setSelectedEvent(id);
    
    return this.repository.getById(id).pipe(
      tap({
        next: (event) => {
          // If the event is not already in the store list, we could add it
          // For now, the store handles selected event via ID
        },
        error: (err) => this.store.setError(err.message || 'Error fetching event detail')
      }),
      finalize(() => this.store.setLoading(false))
    );
  }
}
