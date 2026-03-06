import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EventApiRepository } from './event-api.repository';
import { environment } from '../../../environments/environment';

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
      page: 1,
      size: 1
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

  it('should create an event', () => {
    const newEvent = { title: 'New' } as any;
    const mockRes = { id: 1, ...newEvent, start_date: '2026-01-01', end_date: '2026-01-01' };

    repository.create(newEvent).subscribe(res => {
      expect(res.id).toBe(1);
    });

    const req = httpMock.expectOne(req => req.url.endsWith('/events/') && req.method === 'POST');
    expect(req.request.body).toEqual(newEvent);
    req.flush(mockRes);
  });

  it('should update an event', () => {
    const updateDTO = { title: 'Updated' } as any;
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
});
