import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { EventStore } from '@core/application/store/event.store';
import { AuthStore } from '@core/application/store/auth.store';

describe('ErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let eventStore: EventStore;
  let authStore: { logout: ReturnType<typeof vi.fn>; setError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authStore = { logout: vi.fn(), setError: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: EventStore,
          useValue: { setError: vi.fn() }
        },
        {
          provide: AuthStore,
          useValue: authStore
        },
        {
          provide: Router,
          useValue: { navigate: vi.fn() }
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    eventStore = TestBed.inject(EventStore);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should catch 404 error and set store error message', () => {
    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('El recurso solicitado no existe');
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(eventStore.setError).toHaveBeenCalledWith('El recurso solicitado no existe');
  });

  it('should catch 500 error and set store error message', () => {
    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('Error interno del servidor. Por favor, inténtalo más tarde');
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(eventStore.setError).toHaveBeenCalledWith('Error interno del servidor. Por favor, inténtalo más tarde');
  });

  it('should handle client-side ErrorEvent with Unknown Error', () => {
    const errorEvent = new ErrorEvent('Error', { message: 'Unknown Error' });

    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('No se pudo conectar con el servidor. Comprueba tu conexión a internet o que el servicio esté en marcha.');
      }
    });

    const req = httpMock.expectOne('/test');
    req.error(errorEvent);

    expect(eventStore.setError).toHaveBeenCalledWith('No se pudo conectar con el servidor. Comprueba tu conexión a internet o que el servicio esté en marcha.');
  });

  it('should catch status 0 (no response from server)', () => {
    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('No se pudo conectar con el servidor. Comprueba tu conexión a internet o que el servicio esté en marcha.');
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(null, { status: 0, statusText: 'Unknown Error' });

    expect(eventStore.setError).toHaveBeenCalledWith('No se pudo conectar con el servidor. Comprueba tu conexión a internet o que el servicio esté en marcha.');
  });

  it('should catch 400 error with message', () => {
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Campo requerido')
    });

    const req = httpMock.expectOne('/test');
    req.flush({ message: 'Campo requerido' }, { status: 400, statusText: 'Bad Request' });

    expect(eventStore.setError).toHaveBeenCalledWith('Campo requerido');
  });

  it('should catch 401 error and set auth store error and redirect', () => {
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Sesión expirada. Por favor, inicia sesión de nuevo')
    });

    const req = httpMock.expectOne('/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authStore.setError).toHaveBeenCalledWith('Sesión expirada. Por favor, inicia sesión de nuevo');
    expect(authStore.logout).toHaveBeenCalled();
    expect(eventStore.setError).toHaveBeenCalledWith(null);
  });

  it('should catch 409 error', () => {
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Conflicto: El recurso ya existe o hay un solapamiento')
    });

    const req = httpMock.expectOne('/test');
    req.flush('Conflict', { status: 409, statusText: 'Conflict' });

    expect(eventStore.setError).toHaveBeenCalledWith('Conflicto: El recurso ya existe o hay un solapamiento');
  });

  it('should catch unknown error status', () => {
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Error 503: Service Unavailable')
    });

    const req = httpMock.expectOne('/test');
    req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(eventStore.setError).toHaveBeenCalledWith('Error 503: Service Unavailable');
  });

  it('should call router.navigate on 401 for non-auth request', () => {
    const router = TestBed.inject(Router);
    httpClient.get('/api/events/1').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/events/1');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { expired: '1' } });
  });

  it('should not call eventStore.setError on 401 (auth store gets it)', () => {
    httpClient.get('/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(eventStore.setError).toHaveBeenCalledWith(null);
    expect(eventStore.setError).not.toHaveBeenCalledWith('Sesión expirada. Por favor, inicia sesión de nuevo');
  });

  it('should catch 422 and use api detail or message', () => {
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Validation failed')
    });
    const req = httpMock.expectOne('/test');
    req.flush({ detail: 'Validation failed' }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(eventStore.setError).toHaveBeenCalledWith('Validation failed');
  });

  it('should use api detail array with msg for 400', () => {
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Field is required')
    });
    const req = httpMock.expectOne('/test');
    req.flush({ detail: [{ msg: 'Field is required' }] }, { status: 400, statusText: 'Bad Request' });
    expect(eventStore.setError).toHaveBeenCalledWith('Field is required');
  });

  it('should pass through custom ErrorEvent message when not Unknown Error', () => {
    const errorEvent = new ErrorEvent('Error', { message: 'Custom client error' });
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Custom client error')
    });
    const req = httpMock.expectOne('/test');
    req.error(errorEvent);
    expect(eventStore.setError).toHaveBeenCalledWith('Custom client error');
  });

  it('should handle failed to fetch in ErrorEvent', () => {
    const errorEvent = new ErrorEvent('Error', { message: 'Failed to fetch' });
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toContain('No se pudo conectar con el servidor')
    });
    const req = httpMock.expectOne('/test');
    req.error(errorEvent);
    expect(eventStore.setError).toHaveBeenCalledWith('No se pudo conectar con el servidor. Comprueba tu conexión a internet o que el servicio esté en marcha.');
  });
});
