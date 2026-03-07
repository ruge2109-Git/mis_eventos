import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { concatMap, toArray } from 'rxjs/operators';
import { Session, CreateSessionDTO } from '@core/domain/entities/session.entity';
import { SessionRepository } from '@core/domain/ports/session.repository';

@Injectable({
  providedIn: 'root'
})
export class CreateSessionsUseCase {
  private sessionRepository = inject(SessionRepository);

  execute(dtos: CreateSessionDTO[]): Observable<Session[]> {
    if (dtos.length === 0) {
      return of([]);
    }
    return from(dtos).pipe(
      concatMap(dto => this.sessionRepository.create(dto)),
      toArray()
    );
  }
}
