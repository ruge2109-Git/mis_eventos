import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Session } from '@core/domain/entities/session.entity';
import { SessionRepository } from '@core/domain/ports/session.repository';

@Injectable({
  providedIn: 'root'
})
export class GetSessionsByEventUseCase {
  private sessionRepository = inject(SessionRepository);

  execute(eventId: number): Observable<Session[]> {
    return this.sessionRepository.getByEventId(eventId);
  }
}
