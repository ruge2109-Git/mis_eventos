import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '@core/application/tokens/api-base-url.token';
import { Event } from '@core/domain/entities/event.entity';
import { Registration } from '@core/domain/entities/registration.entity';
import { RegistrationRepository } from '@core/domain/ports/registration.repository';
import { EventApiMapper, type EventResponse } from './mappers/event-api.mapper';

interface RegistrationResponse {
  id: number;
  user_id: number;
  event_id: number;
  registration_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationApiRepository extends RegistrationRepository {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);
  private apiUrl = `${this.baseUrl}/registrations/`;
  private eventMapper = new EventApiMapper(this.baseUrl);

  registerToEvent(eventId: number): Observable<Registration> {
    return this.http
      .post<RegistrationResponse>(this.apiUrl, { event_id: eventId })
      .pipe(map(res => this.mapToEntity(res)));
  }

  unregisterFromEvent(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}event/${eventId}`);
  }

  getByUserId(userId: number): Observable<Registration[]> {
    return this.http
      .get<RegistrationResponse[]>(`${this.apiUrl}user/${userId}`)
      .pipe(map(list => (list ?? []).map(res => this.mapToEntity(res))));
  }

  getRegisteredEventsByUserId(userId: number): Observable<Event[]> {
    return this.http
      .get<EventResponse[]>(`${this.apiUrl}user/${userId}/events`)
      .pipe(map(list => (list ?? []).map(res => this.eventMapper.mapResponseToEntity(res))));
  }

  private mapToEntity(res: RegistrationResponse): Registration {
    return {
      id: res.id,
      userId: res.user_id,
      eventId: res.event_id,
      registrationDate: new Date(res.registration_date)
    };
  }
}
