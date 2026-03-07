import { Observable } from 'rxjs';
import { AdminStats } from '@core/domain/entities/admin-stats.entity';
import { AdminUser } from '@core/domain/entities/admin-user.entity';
import { AdminEventWithOrganizer } from '@core/domain/entities/admin-event-with-organizer.entity';
import { Event } from '@core/domain/entities/event.entity';

export interface TopAttendee {
  userId: number;
  fullName: string;
  email: string;
  registrationCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export abstract class AdminRepository {
  abstract getStats(): Observable<AdminStats>;
  abstract getTopAttendees(
    skip: number,
    limit: number,
    search?: string
  ): Observable<{ items: TopAttendee[]; total: number }>;
  abstract getUpcomingEvents(
    skip: number,
    limit: number,
    search?: string
  ): Observable<{ items: Event[]; total: number }>;
  abstract listUsers(
    skip: number,
    limit: number,
    search?: string,
    role?: string
  ): Observable<PaginatedResponse<AdminUser>>;
  abstract getUserById(userId: number): Observable<AdminUser>;
  abstract listAllEvents(
    skip: number,
    limit: number,
    search?: string,
    status?: string,
    organizerId?: number
  ): Observable<PaginatedResponse<AdminEventWithOrganizer>>;
  /** Events the user is registered to attend (admin only, paginated). */
  abstract getUserRegisteredEvents(
    userId: number,
    skip: number,
    limit: number,
    search?: string
  ): Observable<{ items: Event[]; total: number }>;
}
