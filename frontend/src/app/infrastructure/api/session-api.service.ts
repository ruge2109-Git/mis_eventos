import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface CreateSessionDTO {
  title: string;
  start_time: string;
  end_time: string;
  speaker: string;
  event_id: number;
  description?: string | null;
}

export interface SessionResponse {
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
export class SessionApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sessions/`;

  getByEventId(eventId: number): Observable<SessionResponse[]> {
    return this.http.get<SessionResponse[]>(`${this.apiUrl}event/${eventId}`);
  }

  createSession(dto: CreateSessionDTO): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(this.apiUrl, {
      title: dto.title,
      start_time: dto.start_time,
      end_time: dto.end_time,
      speaker: dto.speaker,
      event_id: dto.event_id,
      description: dto.description ?? undefined
    });
  }
}
