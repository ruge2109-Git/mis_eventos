import { Observable } from 'rxjs';
import { Event, CreateEventDTO, UpdateEventDTO } from '../entities/event.entity';

export abstract class EventRepository {
  abstract getAll(): Observable<Event[]>;
  abstract getById(id: string): Observable<Event>;
  abstract create(event: CreateEventDTO): Observable<Event>;
  abstract update(id: string, event: UpdateEventDTO): Observable<Event>;
  abstract delete(id: string): Observable<void>;
}
