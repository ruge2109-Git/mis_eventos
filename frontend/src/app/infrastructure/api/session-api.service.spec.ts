import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SessionApiService } from './session-api.service';
import { environment } from '@environments/environment';

describe('SessionApiService', () => {
  let service: SessionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(SessionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch sessions by event id', () => {
    const mockSessions = [
      {
        id: 1,
        title: 'Keynote',
        description: null,
        start_time: '2026-06-01T10:00:00',
        end_time: '2026-06-01T11:00:00',
        speaker: 'Jane',
        event_id: 5
      }
    ];

    service.getByEventId(5).subscribe(sessions => {
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe(1);
      expect(sessions[0].title).toBe('Keynote');
      expect(sessions[0].event_id).toBe(5);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sessions/event/5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSessions);
  });

  it('should create a session with correct body', () => {
    const dto = {
      title: 'Workshop',
      start_time: '2026-06-01T14:00:00',
      end_time: '2026-06-01T15:00:00',
      speaker: 'John',
      event_id: 3,
      description: 'A workshop'
    };

    const mockResponse = {
      id: 10,
      title: 'Workshop',
      description: 'A workshop',
      start_time: '2026-06-01T14:00:00',
      end_time: '2026-06-01T15:00:00',
      speaker: 'John',
      event_id: 3
    };

    service.createSession(dto).subscribe(session => {
      expect(session.id).toBe(10);
      expect(session.title).toBe('Workshop');
      expect(session.event_id).toBe(3);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sessions/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: dto.title,
      start_time: dto.start_time,
      end_time: dto.end_time,
      speaker: dto.speaker,
      event_id: dto.event_id,
      description: 'A workshop'
    });
    req.flush(mockResponse);
  });

  it('should create a session without description when null', () => {
    const dto = {
      title: 'Talk',
      start_time: '2026-06-01T10:00:00',
      end_time: '2026-06-01T11:00:00',
      speaker: 'Alice',
      event_id: 1
    };

    service.createSession(dto).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/sessions/`);
    expect(req.request.body.description).toBeUndefined();
    req.flush({ id: 1, ...dto, description: null });
  });
});
