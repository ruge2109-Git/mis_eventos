import { Event } from '@core/domain/entities/event.entity';

export interface AdminEventWithOrganizer extends Event {
  organizerEmail: string;
  organizerFullName: string;
}
