import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Session, CreateSessionDTO } from '@core/domain/entities/session.entity';
import { SessionRepository } from '@core/domain/ports/session.repository';

interface SessionResponse {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  speaker: string;
  event_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionApiRepository extends SessionRepository {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sessions/`;

  getByEventId(eventId: number): Observable<Session[]> {
    return this.http
      .get<SessionResponse[]>(`${this.apiUrl}event/${eventId}`)
      .pipe(map(list => (list ?? []).map(res => this.mapToEntity(res))));
  }

  create(dto: CreateSessionDTO): Observable<Session> {
    const body = {
      title: dto.title,
      start_time: dto.startTime.toISOString(),
      end_time: dto.endTime.toISOString(),
      speaker: dto.speaker,
      event_id: dto.eventId,
      description: dto.description ?? undefined
    };
    return this.http
      .post<SessionResponse>(this.apiUrl, body)
      .pipe(map(res => this.mapToEntity(res)));
  }

  private mapToEntity(res: SessionResponse): Session {
    return {
      id: res.id,
      title: res.title,
      description: res.description,
      startTime: new Date(res.start_time),
      endTime: new Date(res.end_time),
      speaker: res.speaker,
      eventId: res.event_id
    };
  }
}
