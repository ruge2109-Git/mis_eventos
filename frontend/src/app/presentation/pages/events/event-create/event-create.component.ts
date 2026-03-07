import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { EventRepository } from '@core/domain/ports/event.repository';
import { CreateEventDTO } from '@core/domain/entities/event.entity';
import { environment } from '@environments/environment';
import { EventStore } from '@core/application/store/event.store';
import { ToastService } from '@core/application/services/toast.service';
import { SessionApiService } from '@infrastructure/api/session-api.service';
import { Subscription, from } from 'rxjs';
import { finalize, concatMap, toArray, switchMap } from 'rxjs/operators';
import { ImgWithLoaderComponent } from '@shared/components/img-with-loader/img-with-loader.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';

export interface SessionFormItem {
  id?: number;
  title: string;
  start_time: string;
  end_time: string;
  speaker: string;
  description: string;
}

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslocoModule, RouterLink, ImgWithLoaderComponent, ButtonComponent, ConfirmModalComponent],
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
  private sessionApi = inject(SessionApiService);
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
            return this.sessionApi.getByEventId(id);
          }),
          finalize(() => {
            setTimeout(() => {
              this.isLoading = false;
              this.cdr.markForCheck();
            }, 0);
          })
        ).subscribe({
          next: (sessionsList) => {
            this.sessions = (sessionsList || []).map(s => ({
              id: s.id,
              title: s.title,
              start_time: this.toDatetimeLocal(s.start_time),
              end_time: this.toDatetimeLocal(s.end_time),
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

  /** Returns overlap error for session at index, or null. */
  getSessionOverlapError(index: number): string | null {
    const s = this.sessions[index];
    if (!s?.start_time || !s?.end_time) return null;
    const start = new Date(s.start_time).getTime();
    const end = new Date(s.end_time).getTime();
    if (end <= start) return this.t('dashboard.formSessionInvalidTimes');
    for (let i = 0; i < this.sessions.length; i++) {
      if (i === index) continue;
      const o = this.sessions[i];
      if (!o?.start_time || !o?.end_time) continue;
      const oStart = new Date(o.start_time).getTime();
      const oEnd = new Date(o.end_time).getTime();
      if (start < oEnd && end > oStart) return this.t('dashboard.formSessionOverlapError');
    }
    return null;
  }

  private validateSessions(eventStart: Date, eventEnd: Date): string | null {
    for (let i = 0; i < this.sessions.length; i++) {
      if (this.getSessionOverlapError(i)) return this.t('dashboard.formSessionOverlapError');
      const s = this.sessions[i];
      const title = (s.title ?? '').trim();
      if (title.length < 3) {
        return this.transloco.translate('dashboard.formErrorTitleMin');
      }
      if (!s.start_time || !s.end_time) {
        return this.transloco.translate('dashboard.formErrorStartRequired');
      }
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      if (end <= start) {
        return this.transloco.translate('dashboard.formSessionInvalidTimes');
      }
      const eventStartMs = eventStart.getTime();
      const eventEndMs = eventEnd.getTime();
      if (start.getTime() < eventStartMs || end.getTime() > eventEndMs) {
        return this.transloco.translate('dashboard.formSessionOutsideEventDates');
      }
      if (!(s.speaker ?? '').trim()) {
        return this.transloco.translate('dashboard.formSessionSpeaker') + ': ' + this.transloco.translate('dashboard.formErrorTitleRequired');
      }
    }
    return null;
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

  onAdditionalImagesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    const maxSize = 5 * 1024 * 1024;
    const list: File[] = [];
    const previews: string[] = [];
    for (const f of Array.from(files)) {
      if (f.size <= maxSize && f.type.startsWith('image/')) {
        list.push(f);
        previews.push(URL.createObjectURL(f));
      }
    }
    this.additionalImages = [...this.additionalImages, ...list];
    this.additionalImagePreviews = [...this.additionalImagePreviews, ...previews];
    input.value = '';
  }

  onAdditionalImagesDrop(e: DragEvent): void {
    e.preventDefault();
    this.additionalImagesDragOver = false;
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    const maxSize = 5 * 1024 * 1024;
    const list: File[] = [];
    const previews: string[] = [];
    for (const f of Array.from(files)) {
      if (f.size <= maxSize && f.type.startsWith('image/')) {
        list.push(f);
        previews.push(URL.createObjectURL(f));
      }
    }
    this.additionalImages = [...this.additionalImages, ...list];
    this.additionalImagePreviews = [...this.additionalImagePreviews, ...previews];
  }

  onAdditionalImagesDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.additionalImagesDragOver = true;
  }

  onAdditionalImagesDragLeave(): void {
    this.additionalImagesDragOver = false;
  }

  removeAdditionalImage(index: number): void {
    URL.revokeObjectURL(this.additionalImagePreviews[index]);
    this.additionalImages = this.additionalImages.filter((_, i) => i !== index);
    this.additionalImagePreviews = this.additionalImagePreviews.filter((_, i) => i !== index);
  }

  removeAdditionalImageAndStop(event: MouseEvent, index: number): void {
    event.stopPropagation();
    this.removeAdditionalImage(index);
  }

  /** Converts full URL to API path for PATCH additional_images. */
  private additionalUrlToPath(url: string): string {
    const base = environment.apiUrl.replace(/\/+$/, '');
    if (url.startsWith(base)) {
      const p = url.slice(base.length).replace(/^\/+/, '');
      return p ? `/${p}` : '';
    }
    return url.startsWith('/') ? url : `/${url}`;
  }

  removeSavedAdditionalUrl(index: number): void {
    this.savedAdditionalUrls = this.savedAdditionalUrls.filter((_, i) => i !== index);
  }

  removeSavedAdditionalUrlAndStop(e: MouseEvent, index: number): void {
    e.stopPropagation();
    this.removeSavedAdditionalUrl(index);
  }

  get allAdditionalDisplayItems(): { url: string; isNew: boolean; index: number }[] {
    const saved = this.savedAdditionalUrls.map((url, i) => ({ url, isNew: false, index: i }));
    const newOnes = this.additionalImagePreviews.map((url, i) => ({ url, isNew: true, index: i }));
    return [...saved, ...newOnes];
  }

  openPreview(url: string): void {
    this.previewImageUrl = url;
  }

  closePreview(): void {
    this.previewImageUrl = null;
  }

  /** Scrolls to the top of the form (where the error message is) and marks invalid controls as touched. */
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

    const startDate = new Date(value['start_date'] as string);
    const endDate = new Date(value['end_date'] as string);
    if (endDate <= startDate) {
      this.globalError = this.transloco.translate('dashboard.formErrorEndAfterStart');
      this.isLoading = false;
      this.scrollToFormAndRevealErrors();
      return;
    }

    const sessionError = this.validateSessions(startDate, endDate);
    if (sessionError) {
      this.globalError = sessionError;
      this.isLoading = false;
      this.scrollToFormAndRevealErrors();
      return;
    }

    const description = (value['description'] as string)?.trim() || null;
    const updateDto: CreateEventDTO & { additionalImages?: string[] } = {
      title: (value['title'] as string).trim(),
      capacity: Number(value['capacity']),
      startDate,
      endDate,
      location: (value['location'] as string)?.trim() || null,
      description: description || null,
      imageUrl: null as string | null,
      additionalImages: []
    };
    if (this.isEditMode && this.savedAdditionalUrls.length > 0) {
      updateDto.additionalImages = this.savedAdditionalUrls
        .map(u => this.additionalUrlToPath(u))
        .filter(p => p.length > 0);
    }

    const imageFile = this.eventImage;
    const newAdditionalFiles = this.additionalImages;
    const sessionsToCreate = this.sessions.filter(
      s => (s.title ?? '').trim().length >= 3 && s.id == null
    );

    const targetId = this.eventId;
    const doAfterSave = (event: { id: number }) => {
      const doAdditionalUploadsAndNavigate = () => {
        if (newAdditionalFiles.length === 0) {
          this.toast.success(this.isEditMode ? this.transloco.translate('dashboard.toastUpdated') : this.transloco.translate('dashboard.toastCreated'));
          this.router.navigate(['/dashboard/organizer']);
          return;
        }
        this.isLoading = true;
        from(newAdditionalFiles).pipe(
          concatMap(file => this.eventRepository.uploadAdditionalImage(event.id, file)),
          toArray(),
          finalize(() => { this.isLoading = false; })
        ).subscribe({
          next: (results) => {
            if (results.length) this.store.updateEvent(results[results.length - 1]);
            this.toast.success(this.isEditMode ? this.transloco.translate('dashboard.toastUpdated') : this.transloco.translate('dashboard.toastCreated'));
            this.router.navigate(['/dashboard/organizer']);
          },
          error: () => {
            this.toast.success(this.transloco.translate('dashboard.toastCreatedImageFailed'));
            this.router.navigate(['/dashboard/organizer']);
          }
        });
      };
      const doImageAndNavigate = () => {
        if (imageFile) {
          this.isLoading = true;
          this.eventRepository.uploadImage(event.id, imageFile).pipe(
            finalize(() => { this.isLoading = false; })
          ).subscribe({
            next: (updated) => {
              this.store.updateEvent(updated);
              doAdditionalUploadsAndNavigate();
            },
            error: () => {
              doAdditionalUploadsAndNavigate();
            }
          });
        } else {
          doAdditionalUploadsAndNavigate();
        }
      };
      if (sessionsToCreate.length === 0) {
        doImageAndNavigate();
        return;
      }
      this.isLoading = true;
      const payloads = sessionsToCreate.map(s => ({
        title: (s.title ?? '').trim(),
        start_time: new Date(s.start_time).toISOString(),
        end_time: new Date(s.end_time).toISOString(),
        speaker: (s.speaker ?? '').trim(),
        event_id: event.id,
        description: (s.description ?? '').trim() || undefined
      }));
      from(payloads).pipe(
        concatMap(p => this.sessionApi.createSession(p)),
        toArray(),
        finalize(() => { this.isLoading = false; })
      ).subscribe({
        next: () => doImageAndNavigate(),
        error: (err: { error?: { detail?: unknown }; message?: string }) => {
          this.isLoading = false;
          const d = err?.error?.detail;
          const detail = typeof d === 'string' ? d : Array.isArray(d) && d.length && typeof d[0]?.msg === 'string' ? d[0].msg : null;
          this.globalError = detail ?? err?.message ?? this.transloco.translate('dashboard.formErrorSessionCreate');
          this.scrollToFormAndRevealErrors();
        }
      });
    };

    if (this.isEditMode && targetId != null) {
      this.eventRepository.update(targetId, updateDto).pipe(
        finalize(() => { if (sessionsToCreate.length === 0 && !imageFile) this.isLoading = false; })
      ).subscribe({
        next: (event) => {
          this.store.updateEvent(event);
          doAfterSave(event);
        },
        error: (err: { error?: { detail?: unknown }; message?: string }) => {
          this.isLoading = false;
          const detail = typeof err?.error?.detail === 'string' ? err.error.detail : null;
          this.globalError = detail ?? err?.message ?? this.transloco.translate('dashboard.formErrorUpdate');
          this.scrollToFormAndRevealErrors();
        }
      });
    } else {
      this.eventRepository.create(updateDto).pipe(
        finalize(() => { if (sessionsToCreate.length === 0 && !imageFile) this.isLoading = false; })
      ).subscribe({
        next: (event) => {
          this.store.addEvent(event);
          doAfterSave(event);
        },
        error: (err: { error?: { detail?: unknown }; message?: string }) => {
          this.isLoading = false;
          const detail = typeof err?.error?.detail === 'string' ? err.error.detail : null;
          this.globalError = detail ?? err?.message ?? this.transloco.translate('dashboard.formErrorCreate');
          this.scrollToFormAndRevealErrors();
        }
      });
    }
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
