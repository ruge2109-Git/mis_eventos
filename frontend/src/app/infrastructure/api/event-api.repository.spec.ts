import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EventApiRepository } from './event-api.repository';
import { UpdateEventDTO } from '@core/domain/entities/event.entity';
import { dateToLocalISOString } from '@core/application/utils/date.util';
import { environment } from '@environments/environment';

describe('EventApiRepository', () => {
  let repository: EventApiRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventApiRepository,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    repository = TestBed.inject(EventApiRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch paginated events and map to entities', () => {
    const mockResponse = {
      items: [
        {
          id: 1,
          title: 'Event 1',
          description: 'Desc 1',
          capacity: 10,
          status: 'PUBLISHED',
          location: 'Loc 1',
          image_url: '/img1.jpg',
          start_date: '2026-03-06T10:00:00Z',
          end_date: '2026-03-06T12:00:00Z',
          organizer_id: 101
        }
      ],
      total: 100,
      skip: 0,
      limit: 10
    };

    repository.getAll(0, 10).subscribe(result => {
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(100);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].startDate).toBeInstanceOf(Date);
      expect(result.items[0].imageUrl).toBe(`${environment.apiUrl}/img1.jpg`);
    });

    const req = httpMock.expectOne(req => req.url.includes('/events/') && req.params.get('skip') === '0');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch event by id', () => {
    const mockEvent = {
      id: 1,
      title: 'Event 1',
      description: 'Desc 1',
      capacity: 10,
      status: 'PUBLISHED',
      location: 'Loc 1',
      image_url: null,
      start_date: '2026-03-06T10:00:00Z',
      end_date: '2026-03-06T12:00:00Z',
      organizer_id: 101
    };

    repository.getById(1).subscribe(event => {
      expect(event.title).toBe('Event 1');
    });

    const req = httpMock.expectOne(req => req.url.includes('/events/1'));
    req.flush(mockEvent);
  });

  it('should create an event with snake_case body', () => {
    const start = new Date('2026-06-01T10:00:00Z');
    const end = new Date('2026-06-01T12:00:00Z');
    const newEvent = {
      title: 'New',
      capacity: 50,
      startDate: start,
      endDate: end,
      location: null,
      description: null,
      imageUrl: null,
      additionalImages: []
    };
    const mockRes = {
      id: 1,
      title: 'New',
      capacity: 50,
      status: 'DRAFT',
      location: null,
      description: null,
      image_url: null,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      organizer_id: 1
    };

    repository.create(newEvent).subscribe(res => {
      expect(res.id).toBe(1);
      expect(res.title).toBe('New');
    });

    const req = httpMock.expectOne(r => r.url.endsWith('/events/') && r.method === 'POST');
    expect(req.request.body.title).toBe('New');
    expect(req.request.body.capacity).toBe(50);
    expect(req.request.body.start_date).toBe(dateToLocalISOString(start));
    expect(req.request.body.end_date).toBe(dateToLocalISOString(end));
    req.flush(mockRes);
  });

  it('should update an event', () => {
    const updateDTO: UpdateEventDTO = { title: 'Updated' };
    const mockRes = { id: 1, ...updateDTO, start_date: '2026-01-01', end_date: '2026-01-01' };

    repository.update(1, updateDTO).subscribe(res => {
      expect(res.title).toBe('Updated');
    });

    const req = httpMock.expectOne(req => req.url.endsWith('/events/1') && req.method === 'PATCH');
    expect(req.request.body).toEqual(updateDTO);
    req.flush(mockRes);
  });

  it('should delete an event', () => {
    repository.delete(1).subscribe();

    const req = httpMock.expectOne(req => req.url.endsWith('/events/1') && req.method === 'DELETE');
    req.flush(null);
  });

  it('should fetch my events (organizer) with optional search', () => {
    const mockResponse = {
      items: [{ id: 2, title: 'My Event', description: null, capacity: 5, status: 'DRAFT', location: null, image_url: null, start_date: '2026-01-01T00:00:00Z', end_date: '2026-01-01T01:00:00Z', organizer_id: 1 }],
      total: 1,
      skip: 0,
      limit: 12
    };

    repository.getMine(0, 12).subscribe(result => {
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('My Event');
    });

    const req = httpMock.expectOne(r => r.url.includes('/events/mine') && r.params.get('skip') === '0');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should publish an event', () => {
    const mockRes = { id: 1, title: 'E', capacity: 10, status: 'PUBLISHED', location: null, description: null, image_url: null, start_date: '2026-01-01', end_date: '2026-01-01', organizer_id: 1 };
    repository.publish(1).subscribe(res => {
      expect(res.status).toBe('PUBLISHED');
    });
    const req = httpMock.expectOne(r => r.url.endsWith('/events/1/publish') && r.method === 'POST');
    req.flush(mockRes);
  });

  it('should cancel an event', () => {
    const mockRes = { id: 1, title: 'E', capacity: 10, status: 'CANCELLED', location: null, description: null, image_url: null, start_date: '2026-01-01', end_date: '2026-01-01', organizer_id: 1 };
    repository.cancel(1).subscribe(res => {
      expect(res.status).toBe('CANCELLED');
    });
    const req = httpMock.expectOne(r => r.url.endsWith('/events/1/cancel') && r.method === 'POST');
    req.flush(mockRes);
  });

  it('should revert event to draft', () => {
    const mockRes = { id: 1, title: 'E', capacity: 10, status: 'DRAFT', location: null, description: null, image_url: null, start_date: '2026-01-01', end_date: '2026-01-01', organizer_id: 1 };
    repository.revertToDraft(1).subscribe(res => {
      expect(res.status).toBe('DRAFT');
    });
    const req = httpMock.expectOne(r => r.url.endsWith('/events/1/revert-to-draft') && r.method === 'POST');
    req.flush(mockRes);
  });

  it('should upload event image', () => {
    const file = new File([''], 'img.jpg', { type: 'image/jpeg' });
    const mockRes = { id: 1, title: 'E', capacity: 10, status: 'DRAFT', location: null, description: null, image_url: '/uploads/ev1.jpg', start_date: '2026-01-01', end_date: '2026-01-01', organizer_id: 1 };
    repository.uploadImage(1, file).subscribe(res => {
      expect(res.imageUrl).toContain('ev1.jpg');
    });
    const req = httpMock.expectOne(r => r.url.endsWith('/events/1/image') && r.method === 'POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush(mockRes);
  });

  it('should upload additional event image', () => {
    const file = new File([''], 'extra.jpg', { type: 'image/jpeg' });
    const mockRes = {
      id: 1,
      title: 'E',
      capacity: 10,
      status: 'DRAFT',
      location: null,
      description: null,
      image_url: null,
      additional_images: ['/static/events/abc.webp'],
      start_date: '2026-01-01',
      end_date: '2026-01-01',
      organizer_id: 1
    };
    repository.uploadAdditionalImage(1, file).subscribe(res => {
      expect(res.additionalImages.length).toBe(1);
      expect(res.additionalImages[0]).toContain('abc.webp');
    });
    const req = httpMock.expectOne(r => r.url.endsWith('/events/1/additional-images') && r.method === 'POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockRes);
  });

  it('should update event with additional_images in body', () => {
    const updateDTO: UpdateEventDTO = { additionalImages: ['/static/events/a.webp', '/static/events/b.webp'] };
    const mockRes = {
      id: 1,
      title: 'E',
      capacity: 10,
      status: 'DRAFT',
      location: null,
      description: null,
      image_url: null,
      additional_images: ['/static/events/a.webp', '/static/events/b.webp'],
      start_date: '2026-01-01',
      end_date: '2026-01-01',
      organizer_id: 1
    };
    repository.update(1, updateDTO).subscribe(res => {
      expect(res.additionalImages.length).toBe(2);
    });
    const req = httpMock.expectOne(r => r.url.endsWith('/events/1') && r.method === 'PATCH');
    expect(req.request.body.additional_images).toEqual(updateDTO.additionalImages);
    req.flush(mockRes);
  });

  it('should map getById response with additional_images to entity', () => {
    const mockEvent = {
      id: 2,
      title: 'Event 2',
      description: null,
      capacity: 20,
      status: 'PUBLISHED',
      location: null,
      image_url: '/static/cover.webp',
      additional_images: ['/static/events/x.webp'],
      start_date: '2026-06-01T10:00:00Z',
      end_date: '2026-06-01T12:00:00Z',
      organizer_id: 1
    };
    repository.getById(2).subscribe(event => {
      expect(event.additionalImages.length).toBe(1);
      expect(event.additionalImages[0]).toBe(`${environment.apiUrl}/static/events/x.webp`);
      expect(event.imageUrl).toBe(`${environment.apiUrl}/static/cover.webp`);
    });
    const req = httpMock.expectOne(r => r.url.includes('/events/2'));
    req.flush(mockEvent);
  });

  it('should call getMine with search param when provided', () => {
    repository.getMine(0, 12, 'conference').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/events/mine') && r.params.get('search') === 'conference');
    expect(req.request.params.get('skip')).toBe('0');
    expect(req.request.params.get('limit')).toBe('12');
    req.flush({ items: [], total: 0, skip: 0, limit: 12 });
  });
});
