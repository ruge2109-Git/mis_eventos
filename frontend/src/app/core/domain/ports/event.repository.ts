import { Observable } from 'rxjs';
import { Event, CreateEventDTO, UpdateEventDTO } from '@core/domain/entities/event.entity';

export abstract class EventRepository {
  abstract getAll(skip?: number, limit?: number): Observable<{ items: Event[], total: number }>;
  abstract getMine(skip?: number, limit?: number, search?: string): Observable<{ items: Event[], total: number }>;
  abstract getById(id: number): Observable<Event>;
  abstract create(event: CreateEventDTO): Observable<Event>;
  abstract update(id: number, event: UpdateEventDTO): Observable<Event>;
  abstract delete(id: number): Observable<void>;
  abstract publish(id: number): Observable<Event>;
  abstract cancel(id: number): Observable<Event>;
  abstract revertToDraft(id: number): Observable<Event>;
  abstract uploadImage(eventId: number, file: File): Observable<Event>;
  abstract uploadAdditionalImage(eventId: number, file: File): Observable<Event>;
}
