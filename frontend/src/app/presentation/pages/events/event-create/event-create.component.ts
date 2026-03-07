import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { EventRepository, type EventAttendee } from '@core/domain/ports/event.repository';
import type { Session } from '@core/domain/entities/session.entity';
import { API_BASE_URL } from '@core/application/tokens/api-base-url.token';
import { EventStore } from '@core/application/store/event.store';
import { SessionValidationService } from '@core/application/services/session-validation.service';
import { ToastService } from '@core/application/services/toast.service';
import { GetSessionsByEventUseCase } from '@core/application/usecases/get-sessions-by-event.usecase';
import { SaveEventUseCase } from '@core/application/usecases/save-event.usecase';
import { Subscription } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { EventSessionsSectionComponent, type SessionFormItem } from './event-sessions-section/event-sessions-section.component';
import { EventCreateHeaderComponent } from './event-create-header/event-create-header.component';
import { EventDetailsSectionComponent } from './event-details-section/event-details-section.component';
import { EventImagesSectionComponent } from './event-images-section/event-images-section.component';
import { ImagePreviewModalComponent } from './image-preview-modal/image-preview-modal.component';
import { EventFormActionsComponent } from './event-form-actions/event-form-actions.component';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ConfirmModalComponent,
    SearchBarComponent,
    EventSessionsSectionComponent,
    EventCreateHeaderComponent,
    EventDetailsSectionComponent,
    EventImagesSectionComponent,
    ImagePreviewModalComponent,
    EventFormActionsComponent
  ],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss'
})
export class EventCreateComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventRepository = inject(EventRepository);
  private store = inject(EventStore);
  private toast = inject(ToastService);
  private transloco = inject(TranslocoService);
  private getSessionsByEventUseCase = inject(GetSessionsByEventUseCase);
  private saveEventUseCase = inject(SaveEventUseCase);
  private sessionValidation = inject(SessionValidationService);
  private apiBaseUrl = inject(API_BASE_URL);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  private langSub?: Subscription;
  isLoading = false;
  globalError: string | null = null;
  eventForm!: FormGroup;
  eventImage: File | null = null;
  eventImagePreview: string | null = null;
  additionalImages: File[] = [];
  additionalImagePreviews: string[] = [];
  /** URLs of additional images already saved on the server (from API when loading event). */
  savedAdditionalUrls: string[] = [];
  sessions: SessionFormItem[] = [];
  /** Session ids when event was loaded (edit mode); used to compute which were removed. */
  initialSessionIds: number[] = [];
  isEditMode = false;
  eventId: number | null = null;
  additionalImagesDragOver = false;
  previewImageUrl: string | null = null;
  showDeleteConfirm = false;

  /** Attendees (edit mode only): 5 per page, paginated and filterable */
  readonly attendeesPageSize = 5;
  attendees: EventAttendee[] = [];
  attendeesTotal = 0;
  attendeesSkip = 0;
  attendeesSearch = '';
  attendeesLoading = false;

  @ViewChild('formStart') formStartRef?: ElementRef<HTMLFormElement>;

  /** Back link for header: admin list when editing from admin panel, else organizer dashboard. */
  get backLink(): string[] {
    return this.router.url.startsWith('/admin') ? ['/admin/eventos'] : ['/dashboard/organizer'];
  }

  ngOnInit() {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      capacity: [50, [Validators.required, Validators.min(1), Validators.max(100_000)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      location: [''],
      description: ['', Validators.maxLength(2000)],
    });
    this.langSub = this.transloco.langChanges$?.subscribe(() => this.cdr.markForCheck());

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = +idParam;
      if (!Number.isNaN(id)) {
        this.isEditMode = true;
        this.eventId = id;
        this.isLoading = true;
        this.eventRepository.getById(id).pipe(
          switchMap(event => {
            this.eventForm.patchValue({
              title: event.title,
              capacity: event.capacity,
              start_date: this.toDatetimeLocal(event.startDate),
              end_date: this.toDatetimeLocal(event.endDate),
              location: event.location ?? '',
              description: event.description ?? ''
            });
            this.eventImagePreview = event.imageUrl ?? null;
            this.savedAdditionalUrls = event.additionalImages ?? [];
            return this.getSessionsByEventUseCase.execute(id);
          }),
          finalize(() => {
            setTimeout(() => {
              this.isLoading = false;
              this.cdr.markForCheck();
            }, 0);
          })
        ).subscribe({
          next: (sessionsList: Session[]) => {
            const list = sessionsList || [];
            this.sessions = list.map((s: Session) => ({
              id: s.id,
              title: s.title,
              start_time: this.toDatetimeLocal(s.startTime),
              end_time: this.toDatetimeLocal(s.endTime),
              speaker: s.speaker ?? '',
              description: s.description ?? ''
            }));
            this.initialSessionIds = list.map((s: Session) => s.id);
            this.loadAttendees();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.globalError = err?.error?.detail ?? err?.message ?? this.transloco.translate('dashboard.formErrorLoadEvent');
            setTimeout(() => this.scrollToFormAndRevealErrors(), 100);
          }
        });
      }
    }
  }

  private toDatetimeLocal(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
    if (this.isLoading) return;
    if (this.eventImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.eventImagePreview);
    }
    this.additionalImagePreviews.forEach(url => URL.revokeObjectURL(url));
  }

  private t(key: string): string {
    return this.transloco.translate(key) || key;
  }

  addSession(): void {
    this.sessions = [...this.sessions, {
      title: '',
      start_time: '',
      end_time: '',
      speaker: '',
      description: ''
    }];
  }

  removeSession(index: number): void {
    this.sessions = this.sessions.filter((_, i) => i !== index);
  }

  /** Returns overlap error message for session at index, or null. */
  getSessionOverlapError(index: number): string | null {
    const key = this.sessionValidation.getOverlapErrorKey(this.sessions, index);
    return key ? this.t(key) : null;
  }

  /** Bound function for the sessions section component. */
  get sessionErrorFn(): (index: number) => string | null {
    return (i) => this.getSessionOverlapError(i);
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (this.eventImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.eventImagePreview);
    }
    if (this.eventImagePreview) this.eventImagePreview = null;
    if (file && file.size > 5 * 1024 * 1024) {
      this.globalError = this.transloco.translate('dashboard.formErrorImageSize');
      input.value = '';
      this.eventImage = null;
      this.scrollToFormAndRevealErrors();
      return;
    }
    this.eventImage = file;
    this.eventImagePreview = file ? URL.createObjectURL(file) : null;
    this.globalError = null;
  }

  clearCoverImage(): void {
    if (this.eventImagePreview) URL.revokeObjectURL(this.eventImagePreview);
    this.eventImagePreview = null;
    this.eventImage = null;
  }

  setAdditionalImagesDragOver(value: boolean): void {
    this.additionalImagesDragOver = value;
  }

  onAdditionalFilesAdd(files: File[]): void {
    const previews = files.map(f => URL.createObjectURL(f));
    this.additionalImages = [...this.additionalImages, ...files];
    this.additionalImagePreviews = [...this.additionalImagePreviews, ...previews];
  }

  onAdditionalDrop(files: File[]): void {
    const previews = files.map(f => URL.createObjectURL(f));
    this.additionalImages = [...this.additionalImages, ...files];
    this.additionalImagePreviews = [...this.additionalImagePreviews, ...previews];
  }

  removeAdditionalImage(index: number): void {
    URL.revokeObjectURL(this.additionalImagePreviews[index]);
    this.additionalImages = this.additionalImages.filter((_, i) => i !== index);
    this.additionalImagePreviews = this.additionalImagePreviews.filter((_, i) => i !== index);
  }

  removeSavedAdditionalUrl(index: number): void {
    this.savedAdditionalUrls = this.savedAdditionalUrls.filter((_, i) => i !== index);
  }

  openPreview(url: string): void {
    this.previewImageUrl = url;
  }

  closePreview(): void {
    this.previewImageUrl = null;
  }

  private scrollToFormAndRevealErrors(): void {
    this.markInvalidControlsTouched();
    setTimeout(() => {
      const el = this.formStartRef?.nativeElement;
      if (typeof el?.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  private markInvalidControlsTouched(): void {
    Object.keys(this.eventForm.controls).forEach(key => {
      const c = this.eventForm.get(key);
      if (c?.invalid) c.markAsTouched();
    });
  }

  submit(): void {
    this.globalError = null;
    if (!this.eventForm.valid) {
      this.eventForm.markAllAsTouched();
      this.scrollToFormAndRevealErrors();
      return;
    }
    this.isLoading = true;
    const value = this.eventForm.value;
    const sessionsToDelete = this.isEditMode
      ? this.initialSessionIds.filter(id => !this.sessions.some(s => s.id === id))
      : undefined;
    this.saveEventUseCase.execute({
      formValue: value,
      eventImage: this.eventImage,
      additionalImages: [...this.additionalImages],
      savedAdditionalUrls: [...this.savedAdditionalUrls],
      sessions: this.sessions,
      sessionsToDelete,
      isEditMode: this.isEditMode,
      eventId: this.eventId,
      apiBaseUrl: this.apiBaseUrl
    }).pipe(
      finalize(() => { this.isLoading = false; })
    ).subscribe({
      next: (event) => {
        if (this.isEditMode) {
          this.store.updateEvent(event);
        } else {
          this.store.addEvent(event);
        }
        this.toast.success(this.isEditMode ? this.transloco.translate('dashboard.toastUpdated') : this.transloco.translate('dashboard.toastCreated'));
        if (event.warning?.trim()) {
          const msg = event.warning.startsWith('dashboard.') || event.warning.startsWith('errors.')
            ? this.transloco.translate(event.warning) : event.warning;
          this.toast.info(msg);
        }
        this.router.navigate(['/dashboard/organizer']);
      },
      error: (err: { error?: { detail?: unknown }; message?: string }) => {
        const d = err?.error?.detail;
        const apiDetail = typeof d === 'string' ? d : (Array.isArray(d) && d.length > 0 && typeof (d[0] as { msg?: string })?.msg === 'string' ? (d[0] as { msg: string }).msg : null);
        const msg = err?.message ?? apiDetail;
        this.globalError = (msg?.startsWith('dashboard.') ? this.transloco.translate(msg) : msg) ?? this.transloco.translate('dashboard.formErrorCreate');
        this.scrollToFormAndRevealErrors();
      }
    });
  }

  openDeleteConfirm(): void {
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
  }

  loadAttendees(): void {
    if (!this.isEditMode || this.eventId == null) return;
    this.attendeesLoading = true;
    this.eventRepository
      .getEventAttendees(
        this.eventId,
        this.attendeesSkip,
        this.attendeesPageSize,
        this.attendeesSearch || undefined
      )
      .pipe(finalize(() => { this.attendeesLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (res) => {
          this.attendees = res.items;
          this.attendeesTotal = res.total;
          this.cdr.markForCheck();
        },
        error: () => {
          this.attendees = [];
          this.attendeesTotal = 0;
          this.cdr.markForCheck();
        }
      });
  }

  onAttendeesSearchFromBar(value: string): void {
    this.attendeesSearch = value?.trim() ?? '';
    this.attendeesSkip = 0;
    this.loadAttendees();
  }

  /** Números de página a mostrar (1, 2, … última), -1 = ellipsis */
  attendeePageNumbers(): number[] {
    const total = this.attendeesTotalPages;
    const current = this.attendeesCurrentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    const from = Math.max(2, current - 1);
    const to = Math.min(total - 1, current + 1);
    for (let p = from; p <= to; p++) {
      if (!pages.includes(p)) pages.push(p);
    }
    if (current < total - 2) pages.push(-1);
    if (total > 1) pages.push(total);
    return pages.filter((p, i, arr) => p !== -1 || arr[i - 1] !== -1);
  }

  attendeeGoToPage(page: number): void {
    if (page < 1 || page > this.attendeesTotalPages) return;
    this.attendeesSkip = (page - 1) * this.attendeesPageSize;
    this.loadAttendees();
  }

  get attendeesCurrentPage(): number {
    if (this.attendeesTotal === 0) return 0;
    return Math.floor(this.attendeesSkip / this.attendeesPageSize) + 1;
  }

  get attendeesTotalPages(): number {
    return Math.max(1, Math.ceil(this.attendeesTotal / this.attendeesPageSize));
  }

  formatAttendeeDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  confirmDelete(): void {
    if (!this.isEditMode || this.eventId == null) return;
    this.showDeleteConfirm = false;
    this.isLoading = true;
    const id = this.eventId;
    this.eventRepository.delete(id).pipe(
      finalize(() => { this.isLoading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: () => {
        this.store.removeEvent(id);
        this.toast.success(this.transloco.translate('dashboard.toastEventDeleted'));
        this.router.navigate(['/dashboard/organizer']);
      },
      error: (err: { error?: { detail?: unknown }; message?: string }) => {
        const detail = typeof err?.error?.detail === 'string' ? err.error.detail : null;
        this.globalError = detail ?? err?.message ?? this.transloco.translate('dashboard.formErrorLoadEvent');
        this.scrollToFormAndRevealErrors();
      }
    });
  }
}
