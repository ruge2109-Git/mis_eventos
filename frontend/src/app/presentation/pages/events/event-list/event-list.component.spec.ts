import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventListComponent } from './event-list.component';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GetEventsUseCase } from '@core/application/usecases/get-events.usecase';
import { EventStore } from '@core/application/store/event.store';
import { LoadingContextService } from '@core/application/services/loading-context.service';
import { Event } from '@core/domain/entities/event.entity';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

describe('EventListComponent', () => {
  let component: EventListComponent;
  let fixture: ComponentFixture<EventListComponent>;
  let getEventsUseCase: GetEventsUseCase;
  let store: EventStore;
  let loadingContext: LoadingContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [
        provideRouter([]),
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
        EventStore,
        LoadingContextService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    getEventsUseCase = TestBed.inject(GetEventsUseCase);
    store = TestBed.inject(EventStore);
    loadingContext = TestBed.inject(LoadingContextService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call execute on init', () => {
    expect(getEventsUseCase.execute).toHaveBeenCalled();
  });

  it('should call execute with page and search when goToPage is called', () => {
    (getEventsUseCase.execute as ReturnType<typeof vi.fn>).mockClear();
    component.goToPage(2);
    expect(getEventsUseCase.execute).toHaveBeenCalledWith(5, 5, undefined);
  });

  it('should show pagination when total pages > 1', () => {
    store.setEvents(
      Array.from({ length: 5 }, (_, i) => ({ id: i + 1, title: `Event ${i + 1}`, status: 'PUBLISHED' } as unknown as Event)),
      10
    );
    fixture.detectChanges();
    const nav = fixture.debugElement.query(By.css('nav'));
    expect(nav).toBeTruthy();
  });

  it('should render app-search-bar', () => {
    const searchBar = fixture.debugElement.query(By.css('app-search-bar'));
    expect(searchBar).toBeTruthy();
  });

  it('should show loading state when events context loading is true', () => {
    loadingContext.setLoading('events', true);
    fixture.detectChanges();
    const loadingEl = fixture.debugElement.query(By.css('.animate-spin'));
    expect(loadingEl).toBeTruthy();
  });

  it('should show error state and retry button when events context error is set', () => {
    loadingContext.setError('events', 'events.loadError');
    fixture.detectChanges();
    const retryBtn = fixture.debugElement.query(By.css('app-button'));
    expect(retryBtn).toBeTruthy();
  });

  it('should call onSearch when search bar emits', () => {
    const searchBar = fixture.debugElement.query(By.css('app-search-bar'));
    const spy = vi.spyOn(component, 'onSearch');
    searchBar.triggerEventHandler('searchChange', 'test');
    expect(spy).toHaveBeenCalledWith('test');
  });

  it('should call loadPage(1) and set searchQuery when onSearch is called', () => {
    (getEventsUseCase.execute as ReturnType<typeof vi.fn>).mockClear();
    component.onSearch('conferencia');
    expect(component.searchQuery()).toBe('conferencia');
    expect(component.currentPage()).toBe(1);
    expect(getEventsUseCase.execute).toHaveBeenCalledWith(0, 5, 'conferencia');
  });

  it('should handle errors in loadPage without crashing', () => {
    (getEventsUseCase.execute as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('Network err')));
    expect(() => component.loadPage(1)).not.toThrow();
  });

  it('should call loadPage(1) when loadEvents is called', () => {
    const spy = vi.spyOn(component, 'loadPage');
    component.loadEvents();
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('should limit loadPage attempts when page is out of bounds', () => {
    const spy = vi.spyOn(getEventsUseCase, 'execute');
    spy.mockClear();
    component.loadPage(-1);
    expect(spy).not.toHaveBeenCalled();
    store.setEvents([], 50);
    component.loadPage(20);
    expect(spy).not.toHaveBeenCalled();
  });

  describe('pageNumbers()', () => {
    it('should return 1..total if total <= 7', () => {
      store.setEvents([], 25);
      expect(component.pageNumbers()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return ellipsis early on if current is far from start', () => {
      store.setEvents([], 50);
      component.currentPage.set(8);
      expect(component.pageNumbers()).toEqual([1, -1, 7, 8, 9, 10]);
    });

    it('should return ellipsis at the end when current is small', () => {
      store.setEvents([], 50);
      component.currentPage.set(2);
      expect(component.pageNumbers()).toEqual([1, 2, 3, -1, 10]);
    });

    it('should return both ellipsis when current is in middle', () => {
      store.setEvents([], 50);
      component.currentPage.set(5);
      expect(component.pageNumbers()).toEqual([1, -1, 4, 5, 6, -1, 10]);
    });
  });
});
