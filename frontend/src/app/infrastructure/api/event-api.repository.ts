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

  getById(id: number): Observable<Event> {
    return this.http.get<EventResponse>(`${this.apiUrl}${id}`).pipe(
      map(res => this.mapToEntity(res))
    );
  }

  create(event: CreateEventDTO): Observable<Event> {
    return this.http.post<EventResponse>(this.apiUrl, event).pipe(
      map(res => this.mapToEntity(res))
    );
  }

  update(id: number, event: UpdateEventDTO): Observable<Event> {
    return this.http.patch<EventResponse>(`${this.apiUrl}${id}`, event).pipe(
      map(res => this.mapToEntity(res))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}`);
  }

  private mapToEntity(res: EventResponse): Event {
    return {
      id: res.id,
      title: res.title,
      description: res.description,
      startDate: new Date(res.start_date),
      endDate: new Date(res.end_date),
      location: res.location,
      imageUrl: res.image_url ? `${environment.apiUrl}${res.image_url}` : null,
      capacity: res.capacity,
      status: res.status,
      organizerId: res.organizer_id,
      category: 'General', 
      isFeatured: res.id % 5 === 0 
    };
  }
}
