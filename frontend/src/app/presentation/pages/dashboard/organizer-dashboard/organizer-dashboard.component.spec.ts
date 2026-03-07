import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { OrganizerDashboardComponent } from './organizer-dashboard.component';
import { EventStore } from '@core/application/store/event.store';
import { GetOrganizerEventsUseCase } from '@core/application/usecases/get-organizer-events.usecase';
import { EventRepository } from '@core/domain/ports/event.repository';
import { ToastService } from '@core/application/services/toast.service';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { Event } from '@core/domain/entities/event.entity';

const mockEvent: Event = {
  id: 1,
  title: 'Test Event',
  description: 'Desc',
  startDate: new Date(),
  endDate: new Date(),
  location: null,
  imageUrl: null,
  additionalImages: [],
  capacity: 10,
  status: 'DRAFT',
  organizerId: 1
};

describe('OrganizerDashboardComponent', () => {
  let component: OrganizerDashboardComponent;
  let fixture: ComponentFixture<OrganizerDashboardComponent>;
  let getOrganizerEventsUseCase: GetOrganizerEventsUseCase;
  let eventRepository: EventRepository;
  let store: EventStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerDashboardComponent, RouterLink],
      providers: [
        provideRouter([]),
        provideTransloco({ config: { availableLangs: ['es', 'en'], defaultLang: 'es' } }),
        EventStore,
        ToastService,
        {
          provide: GetOrganizerEventsUseCase,
          useValue: { execute: vi.fn().mockReturnValue(of({ items: [], total: 0 })) }
        },
        {
          provide: EventRepository,
          useValue: {
            getMine: vi.fn().mockReturnValue(of({ items: [], total: 0 })),
            publish: vi.fn().mockReturnValue(of({ ...mockEvent, status: 'PUBLISHED' })),
            cancel: vi.fn().mockReturnValue(of({ ...mockEvent, status: 'CANCELLED' })),
            uploadImage: vi.fn().mockReturnValue(of(mockEvent))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerDashboardComponent);
    component = fixture.componentInstance;
    getOrganizerEventsUseCase = TestBed.inject(GetOrganizerEventsUseCase);
    eventRepository = TestBed.inject(EventRepository);
    store = TestBed.inject(EventStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call GetOrganizerEventsUseCase on init', () => {
    expect(getOrganizerEventsUseCase.execute).toHaveBeenCalled();
  });

  it('should show main title and new event button', () => {
    const heading = fixture.debugElement.query(By.css('h1'));
    expect(heading).toBeTruthy();
    const buttons = fixture.debugElement.queryAll(By.css('app-button'));
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show stats cards when not loading', () => {
    store.setEvents([], 0);
    fixture.detectChanges();
    const statCards = fixture.debugElement.queryAll(By.css('.rounded-xl.bg-surface'));
    expect(statCards.length).toBeGreaterThanOrEqual(3);
  });

  it('should show loading state when store is loading', () => {
    store.setLoading(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.animate-spin'))).toBeTruthy();
  });

  it('should show error and retry when store has error', () => {
    store.setError('Error de red');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Error de red');
    const retryBtn = fixture.debugElement.query(By.css('app-button'));
    expect(retryBtn).toBeTruthy();
  });

  it('should display upcoming events and call publish when publish button clicked', () => {
    const futureEvent = { ...mockEvent, startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 86400000 + 3600000) };
    store.setEvents([futureEvent], 1);
    fixture.detectChanges();
    vi.mocked(eventRepository.publish).mockReturnValue(of({ ...futureEvent, status: 'PUBLISHED' }));
    component.publishEvent(futureEvent);
    expect(eventRepository.publish).toHaveBeenCalledWith(1);
  });

  it('should compute totalEvents and upcomingThisMonth from store', () => {
    store.setEvents([mockEvent], 1);
    fixture.detectChanges();
    expect(component.totalEvents()).toBe(1);
  });
});
