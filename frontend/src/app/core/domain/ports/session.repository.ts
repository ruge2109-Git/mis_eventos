import { Observable } from 'rxjs';
import { Session, CreateSessionDTO } from '@core/domain/entities/session.entity';

export abstract class SessionRepository {
  abstract getByEventId(eventId: number): Observable<Session[]>;
  abstract create(dto: CreateSessionDTO): Observable<Session>;
}
