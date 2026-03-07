import { Event } from '@core/domain/entities/event.entity';

export interface EventResponse {
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
  warning?: string;
}

export class EventApiMapper {
  constructor(private readonly apiBaseUrl: string) {}

  mapResponseToEntity(res: EventResponse): Event {
    const base = this.apiBaseUrl.replace(/\/+$/, '');
    const additionalImages = (res.additional_images ?? []).map(url =>
      url.startsWith('http') ? url : `${base}/${url.replace(/^\//, '')}`
    );
    return {
      id: res.id,
      title: res.title,
      description: res.description,
      startDate: new Date(res.start_date),
      endDate: new Date(res.end_date),
      location: res.location,
      imageUrl: res.image_url ? `${base}/${res.image_url.replace(/^\//, '')}` : null,
      additionalImages,
      capacity: res.capacity,
      status: res.status as Event['status'],
      organizerId: res.organizer_id,
      category: 'General',
      ...(res.warning != null && { warning: res.warning })
    };
  }
}
