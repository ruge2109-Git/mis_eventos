import { Observable } from 'rxjs';
import { Session, CreateSessionDTO, UpdateSessionDTO } from '@core/domain/entities/session.entity';

export abstract class SessionRepository {
  abstract getByEventId(eventId: number): Observable<Session[]>;
  abstract getById(sessionId: number): Observable<Session>;
  abstract create(dto: CreateSessionDTO): Observable<Session>;
  abstract update(id: number, dto: UpdateSessionDTO): Observable<Session>;
  abstract delete(id: number): Observable<void>;
}
