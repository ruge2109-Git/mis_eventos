import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '@core/application/tokens/api-base-url.token';
import { SessionRegistration } from '@core/domain/entities/session-registration.entity';
import { SessionRegistrationRepository } from '@core/domain/ports/session-registration.repository';

interface SessionRegistrationResponse {
  id: number;
  user_id: number;
  session_id: number;
  registration_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionRegistrationApiRepository extends SessionRegistrationRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);
  private apiUrl = `${this.baseUrl}/session-registrations/`;

  registerToSession(sessionId: number): Observable<SessionRegistration> {
    return this.http
      .post<SessionRegistrationResponse>(this.apiUrl, { session_id: sessionId })
      .pipe(map(res => this.mapToEntity(res)));
  }

  unregisterFromSession(sessionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${sessionId}`);
  }

  getByUserId(userId: number): Observable<SessionRegistration[]> {
    return this.http
      .get<SessionRegistrationResponse[]>(`${this.apiUrl}user/${userId}`)
      .pipe(map(list => (list ?? []).map(res => this.mapToEntity(res))));
  }

  private mapToEntity(res: SessionRegistrationResponse): SessionRegistration {
    return {
      id: res.id,
      userId: res.user_id,
      sessionId: res.session_id,
      registrationDate: new Date(res.registration_date)
    };
  }
}
