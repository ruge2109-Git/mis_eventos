import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { loadingInterceptor } from './loading.interceptor';
import { EventStore } from '../../core/application/store/event.store';

describe('LoadingInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let eventStore: EventStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        {
          provide: EventStore,
          useValue: {
            setLoading: vi.fn()
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

  it('should set loading to true when request starts and false when ends', () => {
    httpClient.get('/test').subscribe();

    expect(eventStore.setLoading).toHaveBeenCalledWith(true);

    const req = httpMock.expectOne('/test');
    req.flush({});

    expect(eventStore.setLoading).toHaveBeenCalledWith(false);
  });
});
