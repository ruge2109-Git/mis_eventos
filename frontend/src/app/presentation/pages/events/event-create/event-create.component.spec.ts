import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTransloco } from '@jsverse/transloco';
import { EventCreateComponent } from './event-create.component';
import { EventRepository } from '@core/domain/ports/event.repository';
import { EventStore } from '@core/application/store/event.store';
import { ToastService } from '@core/application/services/toast.service';
import { SessionRepository } from '@core/domain/ports/session.repository';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { environment } from '@environments/environment';
import { API_BASE_URL } from '@core/application/tokens/api-base-url.token';
import { Event as EventEntity } from '@core/domain/entities/event.entity';

interface MockSession {
  id: number;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  speaker: string;
  eventId: number;
}

describe('EventCreateComponent', () => {
  let component: EventCreateComponent;
  let fixture: ComponentFixture<EventCreateComponent>;
  let router: Router;

  const mockCreate = vi.fn().mockReturnValue(of({ id: 1, title: 'New', imageUrl: null } as unknown as EventEntity));
  const mockUploadImage = vi.fn().mockReturnValue(of({ id: 1, title: 'New', imageUrl: '/img.jpg' } as unknown as EventEntity));
  const mockUpdate = vi.fn().mockReturnValue(of({ id: 5, title: 'Updated', imageUrl: null, additionalImages: [] } as unknown as EventEntity));
  const mockSessionCreate = vi.fn().mockReturnValue(of({
    id: 1,
    title: 'Keynote',
    description: null,
    startTime: new Date(),
    endTime: new Date(),
    speaker: '',
    eventId: 1
  } as MockSession));
  const mockGetByEventId = vi.fn().mockReturnValue(of([]));
  const mockRepository: EventRepository = {
    getAll: () => of({ items: [], total: 0 }),
    getMine: () => of({ items: [], total: 0 }),
    getById: () => of({} as unknown as EventEntity),
    create: mockCreate,
    update: mockUpdate,
    delete: () => of(undefined),
    publish: () => of({} as unknown as EventEntity),
    cancel: () => of({} as unknown as EventEntity),
    revertToDraft: () => of({} as unknown as EventEntity),
    uploadImage: mockUploadImage,
    uploadAdditionalImage: () => of({ id: 1, title: 'New', imageUrl: null, additionalImages: [] } as unknown as EventEntity),
    getEventAttendees: () => of({ items: [], total: 0 })
  };

  function setEventFormValues(values: Partial<{ title: string; capacity: number; start_date: string; end_date: string; location: string; description: string }>): void {
    const full = {
      title: values.title ?? 'Test Event',
      capacity: values.capacity ?? 50,
      start_date: values.start_date ?? '2026-06-01T10:00',
      end_date: values.end_date ?? '2026-06-01T12:00',
      location: values.location ?? '',
      description: values.description ?? ''
    };
    component.eventForm.setValue(full);
    component.eventForm.updateValueAndValidity();
  }

  beforeEach(async () => {
    await TestBed.resetTestingModule();
    mockCreate.mockClear();
    mockUploadImage.mockClear();
    mockUpdate.mockClear();
    mockSessionCreate.mockClear();
    mockGetByEventId.mockClear();
    mockCreate.mockReturnValue(of({ id: 1, title: 'New', imageUrl: null } as unknown as EventEntity));
    mockUploadImage.mockReturnValue(of({ id: 1, title: 'New', imageUrl: '/img.jpg' } as unknown as EventEntity));
    mockUpdate.mockReturnValue(of({ id: 5, title: 'Updated', imageUrl: null, additionalImages: [] } as unknown as EventEntity));
    mockGetByEventId.mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [EventCreateComponent, RouterTestingModule],
      providers: [
        provideTransloco({ config: { availableLangs: ['es', 'en'], defaultLang: 'es' } }),
        EventStore,
        ToastService,
        { provide: API_BASE_URL, useValue: environment.apiUrl },
        { provide: EventRepository, useValue: mockRepository },
        { provide: SessionRepository, useValue: { create: mockSessionCreate, getByEventId: mockGetByEventId, update: vi.fn().mockReturnValue(of({ id: 1, title: '', description: null, startTime: new Date(), endTime: new Date(), speaker: '', eventId: 1 })), delete: vi.fn().mockReturnValue(of(undefined)) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render back link and event form', () => {
    const links = fixture.debugElement.queryAll(By.css('a'));
    expect(links.length).toBeGreaterThan(0);
    expect(component.eventForm).toBeDefined();
    expect(component.eventForm.get('title')).toBeDefined();
    expect(component.eventForm.get('capacity')).toBeDefined();
  });

  it('should render event details and session manager sections', () => {
    expect(component.eventForm.get('title')).toBeDefined();
    expect(component.eventForm.get('start_date')).toBeDefined();
    const form = fixture.debugElement.query(By.css('form'));
    expect(form).toBeTruthy();
  });

  it('should display globalError in template when set', () => {
    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    component.globalError = 'Location conflict';
    fixture.detectChanges();
    const alert = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(alert).toBeTruthy();
    expect(alert.nativeElement.textContent?.trim()).toContain('Location conflict');
  });

  it('should display title validation error in template when invalid and touched', () => {
    component.eventForm.get('title')?.setValue('');
    component.eventForm.get('title')?.markAsTouched();
    component.eventForm.get('title')?.updateValueAndValidity();
    fixture.detectChanges();
    const errorParagraphs = fixture.debugElement.queryAll(By.css('.text-xs.text-red-400'));
    expect(errorParagraphs.length).toBeGreaterThan(0);
  });

  it('should display capacity validation error in template when invalid and touched', () => {
    component.eventForm.get('capacity')?.setValue(null);
    component.eventForm.get('capacity')?.markAsTouched();
    component.eventForm.get('capacity')?.updateValueAndValidity();
    fixture.detectChanges();
    const errorParagraphs = fixture.debugElement.queryAll(By.css('.text-xs.text-red-400'));
    expect(errorParagraphs.length).toBeGreaterThan(0);
  });

  it('should display start_date validation error in template when invalid and touched', () => {
    component.eventForm.get('start_date')?.setValue('');
    component.eventForm.get('start_date')?.markAsTouched();
    component.eventForm.get('start_date')?.updateValueAndValidity();
    fixture.detectChanges();
    const errorParagraphs = fixture.debugElement.queryAll(By.css('.text-xs.text-red-400'));
    expect(errorParagraphs.length).toBeGreaterThan(0);
  });

  it('should display end_date validation error in template when invalid and touched', () => {
    component.eventForm.get('end_date')?.setValue('');
    component.eventForm.get('end_date')?.markAsTouched();
    component.eventForm.get('end_date')?.updateValueAndValidity();
    fixture.detectChanges();
    const errorParagraphs = fixture.debugElement.queryAll(By.css('.text-xs.text-red-400'));
    expect(errorParagraphs.length).toBeGreaterThan(0);
  });

  it('should display cover preview when eventImagePreview is set', () => {
    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    component.eventImage = new File(['x'], 'cover.jpg', { type: 'image/jpeg' });
    component.eventImagePreview = 'https://example.com/preview.jpg';
    fixture.detectChanges();
    const coverSection = fixture.debugElement.queryAll(By.css('section'))[1];
    const imgWithLoader = coverSection?.query(By.css('app-img-with-loader'));
    expect(imgWithLoader).toBeTruthy();
  });

  it('should add session when Add session button is clicked', () => {
    const sections = fixture.debugElement.queryAll(By.css('section'));
    const sessionSection = sections[3];
    const addBtn = sessionSection?.query(By.css('app-button button[type="button"]')) ?? sessionSection?.query(By.css('button[type="button"]'));
    expect(addBtn).toBeTruthy();
    expect(component.sessions.length).toBe(0);
    addBtn!.nativeElement.click();
    fixture.detectChanges();
    expect(component.sessions.length).toBe(1);
  });

  it('should render session cards when sessions has items', () => {
    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    component.sessions = [
      { title: 'Keynote', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: 'Jane', description: '' }
    ];
    fixture.detectChanges();
    const cards = fixture.debugElement.queryAll(By.css('.session-card'));
    expect(cards.length).toBe(1);
    const titleInput = fixture.debugElement.query(By.css('.session-card input'));
    expect(titleInput).toBeTruthy();
  });

  it('should display session overlap error in template when sessions overlap', () => {
    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    component.sessions = [
      { title: 'S1', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: 'X', description: '' },
      { title: 'S2', start_time: '2026-06-01T10:30', end_time: '2026-06-01T11:30', speaker: 'Y', description: '' }
    ];
    fixture.detectChanges();
    expect(component.getSessionOverlapError(0)).toBeTruthy();
    const errorParagraphs = fixture.debugElement.queryAll(By.css('.session-card .text-red-400'));
    expect(errorParagraphs.length).toBeGreaterThan(0);
  });

  it('should remove session when remove button is clicked', () => {
    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    component.sessions = [
      { title: 'Keynote', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: 'Jane', description: '' }
    ];
    fixture.detectChanges();
    const card = fixture.debugElement.query(By.css('.session-card'));
    const deleteBtn = card?.query(By.css('button[type="button"]'));
    expect(deleteBtn).toBeTruthy();
    deleteBtn.nativeElement.click();
    fixture.detectChanges();
    expect(component.sessions.length).toBe(0);
  });

  it('should show loading state on submit button when isLoading is true', () => {
    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    component.isLoading = true;
    fixture.detectChanges();
    const submitBtn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(submitBtn.nativeElement.disabled).toBe(true);
    const spinner = fixture.debugElement.query(By.css('.animate-spin'));
    expect(spinner).toBeTruthy();
  });

  it('should show create event label on submit button when not loading', () => {
    component.isLoading = false;
    fixture.detectChanges();
    const submitBtn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(submitBtn.nativeElement.disabled).toBe(false);
    const checkIcon = fixture.debugElement.query(By.css('.material-symbols-outlined.text-lg'));
    expect(checkIcon).toBeTruthy();
  });

  it('should render discard link', () => {
    const links = fixture.debugElement.queryAll(By.css('a'));
    expect(links.length).toBeGreaterThanOrEqual(2);
    const formLinks = fixture.debugElement.query(By.css('form'))?.queryAll(By.css('a')) ?? [];
    expect(formLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('should call repository create and navigate on submit', () => {
    mockCreate.mockReturnValue(of({ id: 1 } as unknown as EventEntity));
    const navigateSpy = vi.spyOn(router, 'navigate');
    setEventFormValues({ title: 'New Event', capacity: 50 });
    component.eventImage = null;
    component.submit();
    expect(mockCreate).toHaveBeenCalled();
    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.title).toBe('New Event');
    expect(callArg.capacity).toBe(50);
    expect(callArg.startDate).toBeInstanceOf(Date);
    expect(callArg.endDate).toBeInstanceOf(Date);
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/organizer']);
  });

  it('should set globalError when end_date is before start_date', () => {
    setEventFormValues({
      title: 'Event',
      capacity: 10,
      start_date: '2026-06-01T12:00',
      end_date: '2026-06-01T10:00'
    });
    component.eventImage = null;
    component.sessions = [];
    component.submit();
    expect(component.globalError).toBeDefined();
    expect(component.globalError?.length).toBeGreaterThan(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should set globalError on create failure', () => {
    mockCreate.mockReturnValue(throwError(() => ({ error: { detail: 'Conflict' } })));
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.eventImage = null;
    component.sessions = [];
    component.submit();
    expect(component.globalError).toContain('Conflict');
  });

  it('should call createSession for each session when sessions are provided', () => {
    mockCreate.mockReturnValue(of({ id: 99, title: 'E', imageUrl: null } as unknown as EventEntity));
    mockSessionCreate.mockReturnValue(of({ id: 1, title: 'Keynote', description: null, startTime: new Date(), endTime: new Date(), speaker: 'Jane', eventId: 99 } as MockSession));
    const navigateSpy = vi.spyOn(router, 'navigate');
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.eventImage = null;
    component.sessions = [
      { title: 'Keynote', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: 'Jane', description: '' }
    ];
    expect(component.eventForm.valid).toBe(true);
    component.submit();
    expect(mockCreate).toHaveBeenCalled();
    expect(mockSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Keynote',
      speaker: 'Jane',
      eventId: 99
    }));
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/organizer']);
  });

  it('should call uploadImage after create when image file is provided', () => {
    const file = new File([''], 'cover.jpg', { type: 'image/jpeg' });
    mockCreate.mockReturnValue(of({ id: 99, title: 'E', imageUrl: null } as unknown as EventEntity));
    mockUploadImage.mockReturnValue(of({ id: 99, title: 'E', imageUrl: '/uploads/99.webp' } as unknown as EventEntity));
    const navigateSpy = vi.spyOn(router, 'navigate');
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.eventImage = file;
    component.sessions = [];
    expect(component.eventForm.valid).toBe(true);
    component.submit();
    expect(mockCreate).toHaveBeenCalled();
    expect(mockUploadImage).toHaveBeenCalledWith(99, file);
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/organizer']);
  });

  it('should not call create when form is invalid and should markAllAsTouched', () => {
    const markSpy = vi.spyOn(component.eventForm, 'markAllAsTouched');
    setEventFormValues({ title: '', capacity: 10 });
    component.eventImage = null;
    component.sessions = [];
    component.submit();
    expect(markSpy).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should set globalError and stop loading when session create fails', () => {
    mockCreate.mockReturnValue(of({ id: 99, title: 'E', imageUrl: null } as unknown as EventEntity));
    mockSessionCreate.mockReturnValue(throwError(() => ({ error: { detail: 'Session conflict' } })));
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.sessions = [
      { title: 'Keynote', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: 'Jane', description: '' }
    ];
    component.eventImage = null;
    component.submit();
    expect(component.globalError).toContain('Session conflict');
    expect(component.isLoading).toBe(false);
  });

  it('should navigate to dashboard when uploadImage fails', () => {
    mockCreate.mockReturnValue(of({ id: 99, title: 'E', imageUrl: null } as unknown as EventEntity));
    mockUploadImage.mockReturnValue(throwError(() => new Error('Upload failed')));
    const navigateSpy = vi.spyOn(router, 'navigate');
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.eventImage = new File([''], 'cover.jpg', { type: 'image/jpeg' });
    component.sessions = [];
    component.submit();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/organizer']);
  });

  it('addSession should append a session with default values', () => {
    expect(component.sessions.length).toBe(0);
    component.addSession();
    expect(component.sessions.length).toBe(1);
    expect(component.sessions[0]).toEqual({
      title: '',
      start_time: '',
      end_time: '',
      speaker: '',
      description: ''
    });
    component.addSession();
    expect(component.sessions.length).toBe(2);
  });

  it('removeSession should remove session at index', () => {
    component.sessions = [
      { title: 'A', start_time: '', end_time: '', speaker: '', description: '' },
      { title: 'B', start_time: '', end_time: '', speaker: '', description: '' }
    ];
    component.removeSession(0);
    expect(component.sessions.length).toBe(1);
    expect(component.sessions[0].title).toBe('B');
  });

  it('removeSavedAdditionalUrl should remove url at index', () => {
    component.savedAdditionalUrls = ['https://a.com/1.jpg', 'https://a.com/2.jpg'];
    component.removeSavedAdditionalUrl(0);
    expect(component.savedAdditionalUrls.length).toBe(1);
    expect(component.savedAdditionalUrls[0]).toBe('https://a.com/2.jpg');
  });

  it('onAdditionalFilesAdd should append files and create previews', () => {
    component.savedAdditionalUrls = ['https://example.com/saved.jpg'];
    const file1 = new File(['a'], 'img1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['b'], 'img2.png', { type: 'image/png' });
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:mock');
    component.onAdditionalFilesAdd([file1, file2]);
    expect(component.additionalImages.length).toBe(2);
    expect(component.additionalImagePreviews.length).toBe(2);
    expect(component.savedAdditionalUrls.length).toBe(1);
  });

  it('clearCoverImage should clear eventImage and eventImagePreview', () => {
    component.eventImage = new File([''], 'x.jpg', { type: 'image/jpeg' });
    component.eventImagePreview = 'blob:abc';
    component.clearCoverImage();
    expect(component.eventImage).toBeNull();
    expect(component.eventImagePreview).toBeNull();
  });

  it('openPreview and closePreview should set and clear previewImageUrl', () => {
    expect(component.previewImageUrl).toBeNull();
    component.openPreview('https://example.com/img.jpg');
    expect(component.previewImageUrl).toBe('https://example.com/img.jpg');
    component.closePreview();
    expect(component.previewImageUrl).toBeNull();
  });

  it('removeAdditionalImage should remove image and revoke blob url', () => {
    component.additionalImages = [new File([''], 'a.jpg', { type: 'image/jpeg' })];
    component.additionalImagePreviews = ['blob:url1'];
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    component.removeAdditionalImage(0);
    expect(revokeSpy).toHaveBeenCalledWith('blob:url1');
    expect(component.additionalImages.length).toBe(0);
    expect(component.additionalImagePreviews.length).toBe(0);
  });

  it('removeSavedAdditionalUrl should remove url at index', () => {
    component.savedAdditionalUrls = ['url1', 'url2'];
    component.removeSavedAdditionalUrl(1);
    expect(component.savedAdditionalUrls).toEqual(['url1']);
  });

  it('onAdditionalDrop should append files and create previews', () => {
    const file = new File(['x'], 'drop.jpg', { type: 'image/jpeg' });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:drop');
    component.onAdditionalDrop([file]);
    expect(component.additionalImages.length).toBe(1);
    expect(component.additionalImagePreviews.length).toBe(1);
  });

  it('onAdditionalDrop with empty array should not change length', () => {
    component.onAdditionalDrop([]);
    expect(component.additionalImages.length).toBe(0);
    expect(component.additionalImagePreviews.length).toBe(0);
  });

  it('setAdditionalImagesDragOver should set dragOver state', () => {
    expect(component.additionalImagesDragOver).toBe(false);
    component.setAdditionalImagesDragOver(true);
    expect(component.additionalImagesDragOver).toBe(true);
    component.setAdditionalImagesDragOver(false);
    expect(component.additionalImagesDragOver).toBe(false);
  });

  it('edit mode submit with savedAdditionalUrls should call update with additional_images paths (line 352, additionalUrlToPath)', () => {
    const base = environment.apiUrl.replace(/\/+$/, '');
    component.isEditMode = true;
    component.eventId = 5;
    component.savedAdditionalUrls = [`${base}/static/events/a.webp`, `${base}/static/events/b.webp`];
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.sessions = [];
    component.eventImage = null;
    component.additionalImages = [];
    component.submit();
    expect(mockUpdate).toHaveBeenCalledWith(5, expect.objectContaining({
      additionalImages: ['/static/events/a.webp', '/static/events/b.webp']
    }));
  });

  it('edit mode submit with no sessions and no image should navigate after update (line 371)', () => {
    component.isEditMode = true;
    component.eventId = 5;
    component.savedAdditionalUrls = [];
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.sessions = [];
    component.eventImage = null;
    component.additionalImages = [];
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.submit();
    expect(mockUpdate).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/organizer']);
  });

  it('edit mode submit should call store.updateEvent with updated event (line 435)', () => {
    const updatedEvent = { id: 5, title: 'Updated', imageUrl: null, additionalImages: [] } as unknown as EventEntity;
    mockUpdate.mockReturnValue(of(updatedEvent));
    const store = TestBed.inject(EventStore);
    const updateEventSpy = vi.spyOn(store, 'updateEvent');
    component.isEditMode = true;
    component.eventId = 5;
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.sessions = [];
    component.eventImage = null;
    component.submit();
    expect(updateEventSpy).toHaveBeenCalledWith(updatedEvent);
  });

  it('getSessionOverlapError should return null when session has no start or end', () => {
    component.sessions = [{ title: 'S', start_time: '', end_time: '', speaker: '', description: '' }];
    expect(component.getSessionOverlapError(0)).toBeNull();
  });

  it('getSessionOverlapError should return error when end_time <= start_time', () => {
    component.sessions = [
      { title: 'S', start_time: '2026-06-01T11:00', end_time: '2026-06-01T10:00', speaker: 'X', description: '' }
    ];
    expect(component.getSessionOverlapError(0)).toBeTruthy();
  });

  it('getSessionOverlapError should return error when sessions overlap', () => {
    component.sessions = [
      { title: 'S1', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: 'X', description: '' },
      { title: 'S2', start_time: '2026-06-01T10:30', end_time: '2026-06-01T11:30', speaker: 'Y', description: '' }
    ];
    expect(component.getSessionOverlapError(0)).toBeTruthy();
    expect(component.getSessionOverlapError(1)).toBeTruthy();
  });

  it('should set globalError when session is outside event date range', () => {
    setEventFormValues({
      start_date: '2026-06-01T10:00',
      end_date: '2026-06-01T12:00'
    });
    component.sessions = [
      { title: 'Keynote', start_time: '2026-06-01T09:00', end_time: '2026-06-01T10:30', speaker: 'Jane', description: '' }
    ];
    component.eventImage = null;
    component.submit();
    expect(component.globalError).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should set globalError when session end is after event end', () => {
    setEventFormValues({
      start_date: '2026-06-01T10:00',
      end_date: '2026-06-01T12:00'
    });
    component.sessions = [
      { title: 'Keynote', start_time: '2026-06-01T11:00', end_time: '2026-06-01T13:00', speaker: 'Jane', description: '' }
    ];
    component.eventImage = null;
    component.submit();
    expect(component.globalError).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should set globalError when session has title shorter than 3 characters', () => {
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.sessions = [
      { title: 'Ab', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: 'Jane', description: '' }
    ];
    component.eventImage = null;
    component.submit();
    expect(component.globalError).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should set globalError when session has no speaker', () => {
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.sessions = [
      { title: 'Keynote', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: '', description: '' }
    ];
    component.eventImage = null;
    component.submit();
    expect(component.globalError).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should call createSession for each valid session when multiple sessions provided', () => {
    mockCreate.mockReturnValue(of({ id: 99, title: 'E', imageUrl: null } as unknown as EventEntity));
    mockSessionCreate.mockReturnValue(of({ id: 1, title: 'Keynote', description: null, startTime: new Date(), endTime: new Date(), speaker: 'Jane', eventId: 99 } as MockSession));
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.sessions = [
      { title: 'Keynote', start_time: '2026-06-01T10:00', end_time: '2026-06-01T11:00', speaker: 'Jane', description: '' },
      { title: 'Workshop', start_time: '2026-06-01T11:00', end_time: '2026-06-01T12:00', speaker: 'John', description: '' }
    ];
    component.eventImage = null;
    component.submit();
    expect(mockSessionCreate).toHaveBeenCalledTimes(2);
    expect(mockSessionCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ title: 'Keynote', speaker: 'Jane' }));
    expect(mockSessionCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({ title: 'Workshop', speaker: 'John' }));
  });

  it('onImageChange should set globalError and clear input when file exceeds 5MB', () => {
    const input = document.createElement('input');
    input.type = 'file';
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input, 'files', { value: [bigFile], configurable: true });
    component.onImageChange({ target: input } as unknown as Event);
    expect(component.globalError).toBeTruthy();
    expect(component.eventImage).toBeNull();
  });

  it('onImageChange should set eventImage and clear globalError when file is valid', () => {
    const input = document.createElement('input');
    input.type = 'file';
    const smallFile = new File(['x'], 'small.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input, 'files', { value: [smallFile], configurable: true });
    component.globalError = 'Previous error';
    component.onImageChange({ target: input } as unknown as Event);
    expect(component.eventImage).toBe(smallFile);
    expect(component.globalError).toBeNull();
  });

  it('should set isLoading to false on create error', () => {
    mockCreate.mockReturnValue(throwError(() => ({ error: { detail: 'Conflict' } })));
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.eventImage = null;
    component.sessions = [];
    component.submit();
    expect(component.isLoading).toBe(false);
  });

  it('submit should parse array error details', () => {
    mockCreate.mockReturnValue(throwError(() => ({ error: { detail: [{ msg: 'Title too short' }] } })));
    setEventFormValues({ title: 'Event', capacity: 10 });
    component.submit();
    expect(component.globalError).toBe('Title too short');
  });

  describe('Attendees and Pagination', () => {
    beforeEach(() => {
      component.isEditMode = true;
      component.eventId = 5;
    });

    it('loadAttendees on error should set total 0', () => {
      vi.spyOn(mockRepository, 'getEventAttendees').mockReturnValue(throwError(() => new Error('Net err')));
      component.loadAttendees();
      expect(component.attendeesTotal).toBe(0);
      expect(component.attendees.length).toBe(0);
    });

    it('attendeeGoToPage should limit boundaries and call loadAttendees', () => {
      const spy = vi.spyOn(component, 'loadAttendees');
      component.attendeesTotal = 20; // 4 pages
      component.attendeeGoToPage(0); // < 1
      expect(spy).not.toHaveBeenCalled();

      component.attendeeGoToPage(5); // > 4
      expect(spy).not.toHaveBeenCalled();

      component.attendeeGoToPage(2);
      expect(component.attendeesSkip).toBe(5); // (2-1) * 5
      expect(spy).toHaveBeenCalled();
    });

    it('attendeePageNumbers should show ellipsis and numbers', () => {
      component.attendeesTotal = 50; // 10 pages
      component.attendeesSkip = 20; // page 5
      expect(component.attendeesCurrentPage).toBe(5);
      expect(component.attendeePageNumbers()).toEqual([1, -1, 4, 5, 6, -1, 10]);

      component.attendeesSkip = 5; // page 2
      expect(component.attendeePageNumbers()).toEqual([1, 2, 3, -1, 10]);

      component.attendeesSkip = 40; // page 9
      expect(component.attendeePageNumbers()).toEqual([1, -1, 8, 9, 10]);
    });

    it('attendeesCurrentPage should return 0 if total is 0', () => {
      component.attendeesTotal = 0;
      expect(component.attendeesCurrentPage).toBe(0);
    });

    it('onAttendeesSearchFromBar should trim query and reset skip', () => {
      const spy = vi.spyOn(component, 'loadAttendees');
      component.attendeesSkip = 10;
      component.onAttendeesSearchFromBar(' jon ');
      expect(component.attendeesSearch).toBe('jon');
      expect(component.attendeesSkip).toBe(0);
      expect(spy).toHaveBeenCalled();
    });

    it('formatAttendeeDate should format valid dates', () => {
      expect(component.formatAttendeeDate('')).toBe('');
      const dateStr = component.formatAttendeeDate('2026-03-08T10:00:00Z');
      expect(dateStr).toContain('26');
    });
  });

  describe('Delete Confirm Modal', () => {
    beforeEach(() => {
      component.isEditMode = true;
      component.eventId = 5;
    });

    it('open / close delete confirm should toggle state', () => {
      component.openDeleteConfirm();
      expect(component.showDeleteConfirm).toBe(true);
      component.closeDeleteConfirm();
      expect(component.showDeleteConfirm).toBe(false);
    });

    it('confirmDelete should remove event and navigate', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const store = TestBed.inject(EventStore);
      const removeSpy = vi.spyOn(store, 'removeEvent');
      vi.spyOn(mockRepository, 'delete').mockReturnValue(of(undefined));
      
      component.showDeleteConfirm = true;
      component.confirmDelete();
      
      expect(removeSpy).toHaveBeenCalledWith(5);
      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/organizer']);
      expect(component.showDeleteConfirm).toBe(false);
    });

    it('confirmDelete should handle errors', () => {
      vi.spyOn(mockRepository, 'delete').mockReturnValue(throwError(() => ({ error: { detail: 'Delete failed' } })));
      component.confirmDelete();
      expect(component.globalError).toBe('Delete failed');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('edit mode load (line 73, toDatetimeLocal)', () => {
    const eventWithDates = {
      id: 5,
      title: 'Conferencia',
      capacity: 50,
      startDate: new Date('2026-03-07T01:00:00Z'),
      endDate: new Date('2026-03-07T04:00:00Z'),
      location: 'Bogotá',
      description: null,
      imageUrl: null,
      additionalImages: ['https://api.com/static/events/a.webp'],
      status: 'PUBLISHED',
      organizerId: 4
    };
    const sessionsFromApi = [
      {
        id: 1,
        title: 'S1',
        description: null,
        startTime: new Date('2026-03-07T01:00:00'),
        endTime: new Date('2026-03-07T02:00:00'),
        speaker: 'Jon',
        eventId: 5
      }
    ];

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [EventCreateComponent, RouterTestingModule],
        providers: [
          provideTransloco({ config: { availableLangs: ['es', 'en'], defaultLang: 'es' } }),
          EventStore,
          ToastService,
          { provide: API_BASE_URL, useValue: environment.apiUrl },
          {
            provide: EventRepository,
            useValue: {
              ...mockRepository,
              getById: vi.fn().mockReturnValue(of(eventWithDates))
            }
          },
          {
            provide: SessionRepository,
            useValue: {
              create: mockSessionCreate,
              getByEventId: vi.fn().mockReturnValue(of(sessionsFromApi)),
              update: vi.fn().mockReturnValue(of({ id: 1, title: '', description: null, startTime: new Date(), endTime: new Date(), speaker: '', eventId: 5 })),
              delete: vi.fn().mockReturnValue(of(undefined))
            }
          },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? '5' : null) } } }
          }
        ]
      }).compileComponents();
    });

    it('should patch form and sessions with toDatetimeLocal', () => {
      const editFixture = TestBed.createComponent(EventCreateComponent);
      const editComp = editFixture.componentInstance;
      editFixture.detectChanges();
      expect(editComp.isEditMode).toBe(true);
      expect(editComp.eventId).toBe(5);
      expect(editComp.eventForm.get('title')?.value).toBe('Conferencia');
      expect(editComp.savedAdditionalUrls.length).toBe(1);
      expect(editComp.eventImagePreview).toBeNull();
      editFixture.detectChanges();
      expect(editComp.sessions.length).toBe(1);
      expect(editComp.sessions[0].title).toBe('S1');
      expect(editComp.sessions[0].start_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(editComp.sessions[0].end_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });
});
