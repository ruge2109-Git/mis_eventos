import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface CreateSessionDTO {
  title: string;
  start_time: string; // ISO
  end_time: string;   // ISO
  speaker: string;
  capacity: number;
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
  capacity: number;
  event_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sessions/`;

  createSession(dto: CreateSessionDTO): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(this.apiUrl, {
      title: dto.title,
      start_time: dto.start_time,
      end_time: dto.end_time,
      speaker: dto.speaker,
      capacity: dto.capacity,
      event_id: dto.event_id,
      description: dto.description ?? undefined
    });
  }
}
