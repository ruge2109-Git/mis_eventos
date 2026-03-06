import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { EventStore } from '@core/application/store/event.store';

describe('ErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let eventStore: EventStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: EventStore,
          useValue: {
            setError: vi.fn()
          }
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

  it('should handle client-side ErrorEvent', () => {
    const errorEvent = new ErrorEvent('Client Error', { message: 'Network fails' });
    
    httpClient.get('/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('Error: Network fails');
      }
    });

    const req = httpMock.expectOne('/test');
    req.error(errorEvent);

    expect(eventStore.setError).toHaveBeenCalledWith('Error: Network fails');
  });

  it('should catch 400 error with message', () => {
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Campo requerido')
    });

    const req = httpMock.expectOne('/test');
    req.flush({ message: 'Campo requerido' }, { status: 400, statusText: 'Bad Request' });

    expect(eventStore.setError).toHaveBeenCalledWith('Campo requerido');
  });

  it('should catch 401 error', () => {
    httpClient.get('/test').subscribe({
      error: (err) => expect(err.message).toBe('Sesión expirada. Por favor, inicia sesión de nuevo')
    });

    const req = httpMock.expectOne('/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(eventStore.setError).toHaveBeenCalledWith('Sesión expirada. Por favor, inicia sesión de nuevo');
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
});
