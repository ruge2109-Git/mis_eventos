import { Injectable, inject } from '@angular/core';
import { Event } from '@core/domain/entities/event.entity';
import { EventReader } from '@core/domain/ports/event-reader';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetOrganizerEventsUseCase {
  private repository = inject(EventReader);

  execute(skip = 0, limit = 12, search?: string): Observable<{ items: Event[]; total: number }> {
    return this.repository.getMine(skip, limit, search);
  }
}
