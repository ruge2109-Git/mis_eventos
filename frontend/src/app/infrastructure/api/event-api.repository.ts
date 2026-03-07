import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Event, CreateEventDTO, UpdateEventDTO } from '@core/domain/entities/event.entity';
import { EventRepository } from '@core/domain/ports/event.repository';
import { EventApiMapper } from './mappers/event-api.mapper';
import type { EventResponse } from './mappers/event-api.mapper';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventApiRepository extends EventRepository {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/events/`;
  private mapper = new EventApiMapper(environment.apiUrl);

  getAll(skip = 0, limit = 12): Observable<{ items: Event[], total: number }> {
    return this.http.get<PaginatedResponse<EventResponse>>(this.apiUrl, {
      params: { skip, limit }
    }).pipe(
      map(response => ({
        items: response.items.map(res => this.mapper.mapResponseToEntity(res)),
        total: response.total
      }))
    );
  }

  getMine(skip = 0, limit = 12, search?: string): Observable<{ items: Event[], total: number }> {
    const params: Record<string, number | string> = { skip, limit };
    if (search != null && search !== '') params['search'] = search;
    return this.http.get<PaginatedResponse<EventResponse>>(`${this.apiUrl}mine`, { params }).pipe(
      map(response => ({
        items: response.items.map(res => this.mapper.mapResponseToEntity(res)),
        total: response.total
      }))
    );
  }

  getById(id: number): Observable<Event> {
    return this.http.get<EventResponse>(`${this.apiUrl}${id}`).pipe(
      map(res => this.mapper.mapResponseToEntity(res))
    );
  }

  create(event: CreateEventDTO): Observable<Event> {
    const body = {
      title: event.title,
      capacity: event.capacity,
      start_date: event.startDate.toISOString(),
      end_date: event.endDate.toISOString(),
      location: event.location ?? undefined,
      description: event.description ?? undefined
    };
    return this.http.post<EventResponse>(this.apiUrl, body).pipe(
      map(res => this.mapper.mapResponseToEntity(res))
    );
  }

  update(id: number, event: UpdateEventDTO): Observable<Event> {
    const body: Record<string, unknown> = {};
    if (event.title !== undefined) body['title'] = event.title;
    if (event.capacity !== undefined) body['capacity'] = event.capacity;
    if (event.startDate !== undefined) body['start_date'] = event.startDate.toISOString();
    if (event.endDate !== undefined) body['end_date'] = event.endDate.toISOString();
    if (event.location !== undefined) body['location'] = event.location;
    if (event.description !== undefined) body['description'] = event.description;
    if (event.additionalImages !== undefined) body['additional_images'] = event.additionalImages;
    return this.http.patch<EventResponse>(`${this.apiUrl}${id}`, body).pipe(
      map(res => this.mapper.mapResponseToEntity(res))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }

  publish(id: number): Observable<Event> {
    return this.http.post<EventResponse>(`${this.apiUrl}${id}/publish`, {}).pipe(
      map(res => this.mapper.mapResponseToEntity(res))
    );
  }

  cancel(id: number): Observable<Event> {
    return this.http.post<EventResponse>(`${this.apiUrl}${id}/cancel`, {}).pipe(
      map(res => this.mapper.mapResponseToEntity(res))
    );
  }

  revertToDraft(id: number): Observable<Event> {
    return this.http.post<EventResponse>(`${this.apiUrl}${id}/revert-to-draft`, {}).pipe(
      map(res => this.mapper.mapResponseToEntity(res))
    );
  }

  uploadImage(eventId: number, file: File): Observable<Event> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EventResponse>(`${this.apiUrl}${eventId}/image`, formData).pipe(
      map(res => this.mapper.mapResponseToEntity(res))
    );
  }

  uploadAdditionalImage(eventId: number, file: File): Observable<Event> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EventResponse>(`${this.apiUrl}${eventId}/additional-images`, formData).pipe(
      map(res => this.mapper.mapResponseToEntity(res))
    );
  }

}
