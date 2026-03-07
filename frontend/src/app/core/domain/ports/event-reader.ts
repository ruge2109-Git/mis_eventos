import { Observable } from 'rxjs';
import { Event } from '@core/domain/entities/event.entity';

export abstract class EventReader {
  abstract getAll(skip?: number, limit?: number): Observable<{ items: Event[]; total: number }>;
  abstract getMine(skip?: number, limit?: number, search?: string): Observable<{ items: Event[]; total: number }>;
  abstract getById(id: number): Observable<Event>;
}
