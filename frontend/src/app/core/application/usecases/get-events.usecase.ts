import { Injectable, inject } from '@angular/core';
import { Event } from '@core/domain/entities/event.entity';
import { EventReader } from '@core/domain/ports/event-reader';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetEventsUseCase {
  private repository = inject(EventReader);

  execute(skip = 0, limit = 12): Observable<{ items: Event[]; total: number }> {
    return this.repository.getAll(skip, limit);
  }
}
