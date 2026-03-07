import { Observable } from 'rxjs';
import { Registration } from '@core/domain/entities/registration.entity';
import { Event } from '@core/domain/entities/event.entity';

export abstract class RegistrationRepository {
  abstract registerToEvent(eventId: number): Observable<Registration>;
  abstract unregisterFromEvent(eventId: number): Observable<void>;
  abstract getByUserId(userId: number): Observable<Registration[]>;
  /** Events the user is registered for (single API call). */
  abstract getRegisteredEventsByUserId(userId: number): Observable<Event[]>;
}
