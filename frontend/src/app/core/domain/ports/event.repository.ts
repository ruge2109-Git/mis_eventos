import { Observable } from 'rxjs';
import { Event, CreateEventDTO, UpdateEventDTO } from '@core/domain/entities/event.entity';
import { EventReader } from '@core/domain/ports/event-reader';

export interface EventAttendee {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  registration_date: string;
}

export abstract class EventRepository extends EventReader {
  abstract create(event: CreateEventDTO): Observable<Event>;
  abstract update(id: number, event: UpdateEventDTO): Observable<Event>;
  abstract delete(id: number): Observable<void>;
  abstract publish(id: number): Observable<Event>;
  abstract cancel(id: number): Observable<Event>;
  abstract revertToDraft(id: number): Observable<Event>;
  abstract uploadImage(eventId: number, file: File): Observable<Event>;
  abstract uploadAdditionalImage(eventId: number, file: File): Observable<Event>;
  abstract getEventAttendees(
    eventId: number,
    skip: number,
    limit: number,
    search?: string
  ): Observable<{ items: EventAttendee[]; total: number }>;
}
