import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AdminRepository, PaginatedResponse, TopAttendee } from '@core/domain/ports/admin.repository';
import { AdminStats } from '@core/domain/entities/admin-stats.entity';
import { AdminUser } from '@core/domain/entities/admin-user.entity';
import { AdminEventWithOrganizer } from '@core/domain/entities/admin-event-with-organizer.entity';
import { Event } from '@core/domain/entities/event.entity';
import { EventApiMapper } from './mappers/event-api.mapper';
import type { EventResponse } from './mappers/event-api.mapper';

interface AdminStatsResponse {
  total_users: number;
  total_events: number;
  events_by_status: { DRAFT: number; PUBLISHED: number; CANCELLED: number };
}

interface AdminUserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface PaginatedApiResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

interface AdminEventResponse extends EventResponse {
  organizer_email: string;
  organizer_full_name: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApiRepository extends AdminRepository {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin`;
  private eventMapper = new EventApiMapper(environment.apiUrl);

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStatsResponse>(`${this.baseUrl}/stats`).pipe(
      map(res => ({
        totalUsers: res.total_users,
        totalEvents: res.total_events,
        eventsByStatus: res.events_by_status
      }))
    );
  }

  getTopAttendees(
    skip: number,
    limit: number,
    search?: string
  ): Observable<{ items: TopAttendee[]; total: number }> {
    const params: Record<string, number | string> = { skip, limit };
    if (search != null && search.trim() !== '') params['search'] = search.trim();
    return this.http
      .get<{
        items: { user_id: number; full_name: string; email: string; registration_count: number }[];
        total: number;
        skip: number;
        limit: number;
      }>(`${this.baseUrl}/reports/top-attendees`, { params })
      .pipe(
        map(res => ({
          items: res.items.map(i => ({
            userId: i.user_id,
            fullName: i.full_name,
            email: i.email,
            registrationCount: i.registration_count
          })),
          total: res.total
        }))
      );
  }

  getUpcomingEvents(
    skip: number,
    limit: number,
    search?: string
  ): Observable<{ items: Event[]; total: number }> {
    const params: Record<string, number | string> = { skip, limit };
    if (search != null && search.trim() !== '') params['search'] = search.trim();
    return this.http
      .get<{ items: EventResponse[]; total: number; skip: number; limit: number }>(
        `${this.baseUrl}/reports/upcoming-events`,
        { params }
      )
      .pipe(
        map(res => ({
          items: res.items.map(i => this.eventMapper.mapResponseToEntity(i)),
          total: res.total
        }))
      );
  }

  listUsers(
    skip: number,
    limit: number,
    search?: string,
    role?: string
  ): Observable<PaginatedResponse<AdminUser>> {
    const params: Record<string, string | number> = { skip, limit };
    if (search != null && search !== '') params['search'] = search;
    if (role != null && role !== '') params['role'] = role;
    return this.http
      .get<PaginatedApiResponse<AdminUserResponse>>(`${this.baseUrl}/users`, { params })
      .pipe(
        map(res => ({
          items: res.items.map(u => ({
            id: u.id,
            email: u.email,
            fullName: u.full_name,
            role: u.role,
            createdAt: u.created_at
          })),
          total: res.total
        }))
      );
  }

  getUserById(userId: number): Observable<AdminUser> {
    return this.http.get<AdminUserResponse>(`${this.baseUrl}/users/${userId}`).pipe(
      map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        createdAt: u.created_at
      }))
    );
  }

  listAllEvents(
    skip: number,
    limit: number,
    search?: string,
    status?: string,
    organizerId?: number
  ): Observable<PaginatedResponse<AdminEventWithOrganizer>> {
    const params: Record<string, string | number> = { skip, limit };
    if (search != null && search !== '') params['search'] = search;
    if (status != null && status !== '') params['status'] = status;
    if (organizerId != null) params['organizer_id'] = organizerId;
    return this.http
      .get<PaginatedApiResponse<AdminEventResponse>>(`${this.baseUrl}/events`, { params })
      .pipe(
        map(res => ({
          items: res.items.map(e => ({
            ...this.eventMapper.mapResponseToEntity(e),
            organizerEmail: e.organizer_email,
            organizerFullName: e.organizer_full_name
          })),
          total: res.total
        }))
      );
  }

  getUserRegisteredEvents(
    userId: number,
    skip: number,
    limit: number,
    search?: string
  ): Observable<{ items: Event[]; total: number }> {
    const params: Record<string, number | string> = { skip, limit };
    if (search != null && search.trim() !== '') params['search'] = search.trim();
    return this.http
      .get<{ items: EventResponse[]; total: number; skip: number; limit: number }>(
        `${this.baseUrl}/users/${userId}/registered-events`,
        { params }
      )
      .pipe(
        map(res => ({
          items: res.items.map(i => this.eventMapper.mapResponseToEntity(i)),
          total: res.total
        }))
      );
  }
}
