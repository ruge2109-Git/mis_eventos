import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Event, CreateEventDTO, UpdateEventDTO } from '@core/domain/entities/event.entity';
import { EventRepository } from '@core/domain/ports/event.repository';

interface EventResponse {
  id: number;
  title: string;
  description: string | null;
  capacity: number;
  status: 'PUBLISHED' | 'DRAFT' | 'CANCELLED';
  location: string | null;
  image_url: string | null;
  additional_images?: string[];
  start_date: string;
  end_date: string;
  organizer_id: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventApiRepository extends EventRepository {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/events/`;

  getAll(skip: number = 0, limit: number = 12): Observable<{ items: Event[], total: number }> {
    return this.http.get<PaginatedResponse<EventResponse>>(this.apiUrl, {
      params: { skip, limit }
    }).pipe(
      map(response => ({
        items: response.items.map(res => this.mapToEntity(res)),
        total: response.total
      }))
    );
  }

  getMine(skip: number = 0, limit: number = 12, search?: string): Observable<{ items: Event[], total: number }> {
    const params: Record<string, number | string> = { skip, limit };
    if (search != null && search !== '') params['search'] = search;
    return this.http.get<PaginatedResponse<EventResponse>>(`${this.apiUrl}mine`, { params }).pipe(
      map(response => ({
        items: response.items.map(res => this.mapToEntity(res)),
        total: response.total
      }))
    );
  }

  getById(id: number): Observable<Event> {
    return this.http.get<EventResponse>(`${this.apiUrl}${id}`).pipe(
      map(res => this.mapToEntity(res))
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
      map(res => this.mapToEntity(res))
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
      map(res => this.mapToEntity(res))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }

  publish(id: number): Observable<Event> {
    return this.http.post<EventResponse>(`${this.apiUrl}${id}/publish`, {}).pipe(
      map(res => this.mapToEntity(res))
    );
  }

  cancel(id: number): Observable<Event> {
    return this.http.post<EventResponse>(`${this.apiUrl}${id}/cancel`, {}).pipe(
      map(res => this.mapToEntity(res))
    );
  }

  uploadImage(eventId: number, file: File): Observable<Event> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EventResponse>(`${this.apiUrl}${eventId}/image`, formData).pipe(
      map(res => this.mapToEntity(res))
    );
  }

  uploadAdditionalImage(eventId: number, file: File): Observable<Event> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EventResponse>(`${this.apiUrl}${eventId}/additional-images`, formData).pipe(
      map(res => this.mapToEntity(res))
    );
  }

  private mapToEntity(res: EventResponse): Event {
    const additionalImages = (res.additional_images ?? []).map(
      url => (url.startsWith('http') ? url : `${environment.apiUrl}${url}`)
    );
    return {
      id: res.id,
      title: res.title,
      description: res.description,
      startDate: new Date(res.start_date),
      endDate: new Date(res.end_date),
      location: res.location,
      imageUrl: res.image_url ? `${environment.apiUrl}${res.image_url}` : null,
      additionalImages,
      capacity: res.capacity,
      status: res.status as Event['status'],
      organizerId: res.organizer_id,
      category: 'General',
      isFeatured: res.id % 5 === 0
    };
  }
}
