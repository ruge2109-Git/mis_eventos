import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Event, CreateEventDTO, UpdateEventDTO } from '../../core/domain/entities/event.entity';
import { EventRepository } from '../../core/domain/ports/event.repository';

@Injectable({
  providedIn: 'root'
})
export class EventApiRepository extends EventRepository {
  private http = inject(HttpClient);
  private apiUrl = 'api/events'; // Placeholder URL

  // Mock data for initial development
  private mockEvents: Event[] = [
    {
      id: '1',
      title: 'Neon Symphony 2026',
      description: 'Experience the first multi-sensory AI orchestra in the heart of Neo Tokyo. A fusion of light and sound.',
      date: new Date('2026-10-24'),
      location: 'Neo Tokyo',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBXpRXtVlrAmYZaeC7Rd-EkaiGMxaCDcdLVxhxvt-GgUI_FkOdJqyTQwHkIcYwVv6csvFWYnt_DvXDD7JH7utUQ6J-r2hd-j5noWQEDrl8omp2cLv3abB4ntE4lYt3xVD6Hk_h1QW-Gci5Goyheiz-FOX28E0kjEeLVjq7N1Bf0s1-5ver2PZH7-rhnma-VyAs2qCYcA_KRe06b7YUVy7KLgAFMB-Hd7srbUzAFc5VHgDaMXX6tEwxs71USQwwicYAhddnogd0NVE',
      capacity: 850,
      maxCapacity: 1000,
      isOpen: true,
      status: 'published',
      organizerId: 'org1',
      category: 'Concierto',
      isFeatured: true
    },
    {
      id: '2',
      title: 'Mars Colonization Forum',
      description: 'Discuss the challenges and opportunities of living on the red planet.',
      date: new Date('2026-11-12'),
      location: 'Online / VR',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxxRIOwD2LKZ0xxhaY1Zf1zN2mA5neI7xFtr4SLnGoW29NYMZYKjjUlA1SAj6UBbYV1eKsUjzmV516plXGel_sQsqVklRJ7ckrZMdBBt3rcUo7Sxaxcb6ZBckvGBhrehTZNR-5qfCW9m62IbSdbowlc4MA0IxN4DfctTj724aBU-0RgoEM14XFhDQke9IGJscbfZgz4My4MG2UAo2hFuJzp3ZZTvIGSVIWeakm1TfGALegCKgbjhaUY8AEWhiOAm-wkOfI7u9zbjs',
      capacity: 120,
      maxCapacity: 300,
      isOpen: true,
      status: 'published',
      organizerId: 'org2',
      category: 'Taller'
    }
  ];

  getAll(): Observable<Event[]> {
    // Return mock data with delay to simulate network latency
    return of(this.mockEvents).pipe(delay(1000));
    // Implementation with actual API:
    // return this.http.get<Event[]>(this.apiUrl);
  }

  getById(id: string): Observable<Event> {
    const event = this.mockEvents.find(e => e.id === id);
    if (!event) throw new Error('Event not found');
    return of(event).pipe(delay(500));
  }

  create(event: CreateEventDTO): Observable<Event> {
    const newEvent: Event = { ...event, id: Math.random().toString(36).substring(2, 9) };
    this.mockEvents.push(newEvent);
    return of(newEvent).pipe(delay(800));
  }

  update(id: string, event: UpdateEventDTO): Observable<Event> {
    const index = this.mockEvents.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Event not found');
    const updated = { ...this.mockEvents[index], ...event };
    this.mockEvents[index] = updated;
    return of(updated).pipe(delay(800));
  }

  delete(id: string): Observable<void> {
    this.mockEvents = this.mockEvents.filter(e => e.id !== id);
    return of(undefined).pipe(delay(500));
  }
}
