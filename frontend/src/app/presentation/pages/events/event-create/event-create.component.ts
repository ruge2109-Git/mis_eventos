import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { EventRepository } from '@core/domain/ports/event.repository';
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
  isEditMode = false;
  eventId: number | null = null;
  additionalImagesDragOver = false;
  previewImageUrl: string | null = null;
  showDeleteConfirm = false;

  @ViewChild('formStart') formStartRef?: ElementRef<HTMLFormElement>;

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
            this.sessions = (sessionsList || []).map((s: Session) => ({
              id: s.id,
              title: s.title,
              start_time: this.toDatetimeLocal(s.startTime),
              end_time: this.toDatetimeLocal(s.endTime),
              speaker: s.speaker ?? '',
              description: s.description ?? ''
            }));
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
    this.saveEventUseCase.execute({
      formValue: value,
      eventImage: this.eventImage,
      additionalImages: [...this.additionalImages],
      savedAdditionalUrls: [...this.savedAdditionalUrls],
      sessions: this.sessions,
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
