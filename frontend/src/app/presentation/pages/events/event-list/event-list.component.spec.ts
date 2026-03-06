import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventListComponent } from './event-list.component';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GetEventsUseCase } from '@core/application/usecases/get-events.usecase';
import { EventStore } from '@core/application/store/event.store';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('EventListComponent', () => {
  let component: EventListComponent;
  let fixture: ComponentFixture<EventListComponent>;
  let getEventsUseCase: GetEventsUseCase;
  let store: EventStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: {
            availableLangs: ['es', 'en'],
            defaultLang: 'es',
          }
        }),
        {
          provide: GetEventsUseCase,
          useValue: {
            execute: vi.fn().mockReturnValue(of({ items: [], total: 0 }))
          }
        },
        EventStore
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    getEventsUseCase = TestBed.inject(GetEventsUseCase);
    store = TestBed.inject(EventStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call execute on init', () => {
    expect(getEventsUseCase.execute).toHaveBeenCalled();
  });

  it('should call execute with append when onLoadMore is called', () => {
    store.setEvents([], 24);
    store.setPagination(0, 12);
    
    component.onLoadMore();
    
    expect(getEventsUseCase.execute).toHaveBeenCalledWith(12, 12, true);
  });

  it('should show "Load More" button only if hasMore is true', () => {
    store.setEvents([], 24);
    fixture.detectChanges();
    let loadMoreBtn = fixture.debugElement.query(By.css('app-button'));
    expect(loadMoreBtn).toBeTruthy();

    const fullEvents = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, title: `Event ${i+1}`, status: 'PUBLISHED' } as any));
    store.setEvents(fullEvents, 24);
    fixture.detectChanges();
    loadMoreBtn = fixture.debugElement.query(By.css('app-button[customClass*="min-w-[200px]"]'));
    expect(loadMoreBtn).toBeFalsy();
  });
});
