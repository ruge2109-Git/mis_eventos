import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  afterEach(() => {
    localStorage.removeItem('access_token');
  });

  it('should not add Authorization header when no token', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/events').subscribe();

    const req = httpMock.expectOne('/api/events');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Bearer token to request when token exists', () => {
    localStorage.setItem('access_token', 'fake-jwt-token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/events/mine').subscribe();

    const req = httpMock.expectOne('/api/events/mine');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
    req.flush({});
  });
});
