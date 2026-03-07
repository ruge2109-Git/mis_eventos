import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { OrganizerDashboardComponent } from './organizer-dashboard.component';
import { EventStore } from '@core/application/store/event.store';
import { GetOrganizerEventsUseCase } from '@core/application/usecases/get-organizer-events.usecase';
import { EventRepository } from '@core/domain/ports/event.repository';
import { ToastService } from '@core/application/services/toast.service';
import { LoadingContextService } from '@core/application/services/loading-context.service';
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
        LoadingContextService,
        ToastService,
        {
          provide: GetOrganizerEventsUseCase,
          useValue: { execute: vi.fn().mockReturnValue(of({ items: [], total: 0 })) }
        },
        {
          provide: EventRepository,
          useValue: {
            getAll: vi.fn().mockReturnValue(of({ items: [], total: 0 })),
            getMine: vi.fn().mockReturnValue(of({ items: [], total: 0 })),
            getById: vi.fn().mockReturnValue(of(mockEvent)),
            create: vi.fn().mockReturnValue(of(mockEvent)),
            update: vi.fn().mockReturnValue(of(mockEvent)),
            delete: vi.fn().mockReturnValue(of(undefined)),
            publish: vi.fn().mockReturnValue(of({ ...mockEvent, status: 'PUBLISHED' })),
            cancel: vi.fn().mockReturnValue(of({ ...mockEvent, status: 'CANCELLED' })),
            revertToDraft: vi.fn().mockReturnValue(of({ ...mockEvent, status: 'DRAFT' })),
            uploadImage: vi.fn().mockReturnValue(of(mockEvent)),
            uploadAdditionalImage: vi.fn().mockReturnValue(of(mockEvent))
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

  it('should show loading state when events context is loading', () => {
    const loadingContext = TestBed.inject(LoadingContextService);
    loadingContext.setLoading('events', true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.animate-spin'))).toBeTruthy();
  });

  it('should show error and retry when events context has error', () => {
    const loadingContext = TestBed.inject(LoadingContextService);
    loadingContext.setError('events', 'events.loadError');
    fixture.detectChanges();
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

  it('should compute upcomingThisMonth filtering by date and non-cancelled', () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);
    const eventThisMonth = { ...mockEvent, id: 2, startDate: thisMonth, endDate: thisMonth, status: 'PUBLISHED' as const };
    const cancelled = { ...mockEvent, id: 3, startDate: thisMonth, endDate: thisMonth, status: 'CANCELLED' as const };
    store.setEvents([eventThisMonth, cancelled], 2);
    fixture.detectChanges();
    expect(component.upcomingThisMonth()).toBe(1);
  });

  it('should compute attendanceRate', () => {
    store.setEvents([], 0);
    expect(component.attendanceRate()).toBe(0);
    store.setEvents([mockEvent], 1);
    fixture.detectChanges();
    expect(component.attendanceRate()).toBeGreaterThanOrEqual(70);
  });

  it('should compute upcomingEvents sorted by startDate limited to 6', () => {
    const e1 = { ...mockEvent, id: 1, startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 86400000 + 3600000) };
    const e2 = { ...mockEvent, id: 2, startDate: new Date(Date.now() + 172800000), endDate: new Date(Date.now() + 172800000 + 3600000) };
    store.setEvents([e2, e1], 2);
    fixture.detectChanges();
    const upcoming = component.upcomingEvents();
    expect(upcoming.length).toBe(2);
    expect(upcoming[0].id).toBe(1);
    expect(upcoming[1].id).toBe(2);
  });

  it('isActionLoading should return true when actionLoadingId matches', () => {
    expect(component.isActionLoading(1)).toBe(false);
    component.actionLoadingId.set(1);
    expect(component.isActionLoading(1)).toBe(true);
    expect(component.isActionLoading(2)).toBe(false);
  });

  it('openDeleteConfirm and closeDeleteConfirm should update eventIdToDelete', () => {
    expect(component.showDeleteConfirm()).toBe(false);
    component.openDeleteConfirm(5);
    expect(component.eventIdToDelete()).toBe(5);
    expect(component.showDeleteConfirm()).toBe(true);
    component.closeDeleteConfirm();
    expect(component.eventIdToDelete()).toBeNull();
    expect(component.showDeleteConfirm()).toBe(false);
  });

  it('should call cancelEvent and update store on success', () => {
    const publishedEvent = { ...mockEvent, id: 10, status: 'PUBLISHED' as const };
    vi.mocked(eventRepository.cancel).mockReturnValue(of({ ...publishedEvent, status: 'CANCELLED' as const }));
    const updateSpy = vi.spyOn(store, 'updateEvent');
    component.cancelEvent(publishedEvent);
    expect(eventRepository.cancel).toHaveBeenCalledWith(10);
    expect(updateSpy).toHaveBeenCalled();
    expect(component.actionLoadingId()).toBeNull();
  });

  it('should call revertEventToDraft and update store on success', () => {
    const cancelledEvent = { ...mockEvent, id: 11, status: 'CANCELLED' as const };
    vi.mocked(eventRepository.revertToDraft).mockReturnValue(of({ ...cancelledEvent, status: 'DRAFT' as const }));
    const updateSpy = vi.spyOn(store, 'updateEvent');
    component.revertEventToDraft(cancelledEvent);
    expect(eventRepository.revertToDraft).toHaveBeenCalledWith(11);
    expect(updateSpy).toHaveBeenCalled();
    expect(component.actionLoadingId()).toBeNull();
  });

  it('confirmDelete should call delete, removeEvent and close modal on success', () => {
    component.openDeleteConfirm(7);
    vi.mocked(eventRepository.delete).mockReturnValue(of(undefined));
    const removeSpy = vi.spyOn(store, 'removeEvent');
    component.confirmDelete();
    expect(eventRepository.delete).toHaveBeenCalledWith(7);
    expect(removeSpy).toHaveBeenCalledWith(7);
    expect(component.eventIdToDelete()).toBeNull();
    expect(component.actionLoadingId()).toBeNull();
  });

  it('confirmDelete should do nothing when eventIdToDelete is null', () => {
    vi.mocked(eventRepository.delete).mockClear();
    component.confirmDelete();
    expect(eventRepository.delete).not.toHaveBeenCalled();
  });

  it('loadEvents with append should call use case and update store on success', () => {
    store.setPagination(10, 10);
    vi.mocked(getOrganizerEventsUseCase.execute).mockClear();
    vi.mocked(getOrganizerEventsUseCase.execute).mockReturnValue(of({ items: [mockEvent], total: 30 }));
    component.loadEvents(true);
    expect(getOrganizerEventsUseCase.execute).toHaveBeenCalledWith(20, 10);
    expect(store.pagination().skip).toBe(20);
  });

  it('should show confirm modal when showDeleteConfirm is true', () => {
    component.openDeleteConfirm(1);
    fixture.detectChanges();
    const modal = fixture.debugElement.query(By.css('app-confirm-modal'));
    expect(modal).toBeTruthy();
  });

  it('cancelEvent should show toast and clear loading on error', () => {
    const toast = TestBed.inject(ToastService);
    const errorSpy = vi.spyOn(toast, 'error');
    vi.mocked(eventRepository.cancel).mockReturnValue(throwError(() => ({ error: { detail: 'Bad request' } })));
    const publishedEvent = { ...mockEvent, id: 20, status: 'PUBLISHED' as const };
    component.cancelEvent(publishedEvent);
    expect(errorSpy).toHaveBeenCalled();
    expect(component.actionLoadingId()).toBeNull();
  });
});
