import { Observable } from 'rxjs';
import { SessionRegistration } from '@core/domain/entities/session-registration.entity';

export abstract class SessionRegistrationRepository {
  abstract registerToSession(sessionId: number): Observable<SessionRegistration>;
  abstract unregisterFromSession(sessionId: number): Observable<void>;
  abstract getByUserId(userId: number): Observable<SessionRegistration[]>;
}
