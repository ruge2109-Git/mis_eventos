import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { EventRepository } from '@core/domain/ports/event.repository';
import { CreateEventDTO } from '@core/domain/entities/event.entity';
import { EventStore } from '@core/application/store/event.store';
import { ToastService } from '@core/application/services/toast.service';
import { SessionApiService } from '@infrastructure/api/session-api.service';
import { Subscription, from } from 'rxjs';
import { finalize, concatMap, toArray } from 'rxjs/operators';

export interface SessionFormItem {
  title: string;
  start_time: string;
  end_time: string;
  speaker: string;
  capacity: number;
  description: string;
}

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslocoModule, RouterLink],
  templateUrl: './event-create.component.html',
  styleUrl: './event-create.component.scss'
})
export class EventCreateComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private eventRepository = inject(EventRepository);
  private store = inject(EventStore);
  private toast = inject(ToastService);
  private transloco = inject(TranslocoService);
  private sessionApi = inject(SessionApiService);
  private fb = inject(FormBuilder);

  private langSub?: Subscription;
  isLoading = false;
  globalError: string | null = null;
  eventForm!: FormGroup;
  eventImage: File | null = null;
  sessions: SessionFormItem[] = [];

  ngOnInit() {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      capacity: [50, [Validators.required, Validators.min(1), Validators.max(100_000)]],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      location: [''],
      description: ['', Validators.maxLength(2000)],
    });
    this.langSub = this.transloco.langChanges$?.subscribe(() => {});
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
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
      capacity: 50,
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

  /** Returns error message if invalid, null if ok. */
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
      const cap = Number(s.capacity);
      if (!Number.isInteger(cap) || cap < 1) {
        return this.transloco.translate('dashboard.formErrorCapacityMin');
      }
    }
    return null;
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      this.globalError = this.t('dashboard.formErrorImageSize');
      input.value = '';
      this.eventImage = null;
      return;
    }
    this.eventImage = file;
    this.globalError = null;
  }

  submit(): void {
    this.globalError = null;
    if (!this.eventForm.valid) {
      this.eventForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const value = this.eventForm.value;

    const startDate = new Date(value['start_date'] as string);
    const endDate = new Date(value['end_date'] as string);
    if (endDate <= startDate) {
      this.globalError = this.transloco.translate('dashboard.formErrorEndAfterStart');
      this.isLoading = false;
      return;
    }

    const sessionError = this.validateSessions(startDate, endDate);
    if (sessionError) {
      this.globalError = sessionError;
      this.isLoading = false;
      return;
    }

    const description = (value['description'] as string)?.trim() || null;
    const dto: CreateEventDTO = {
      title: (value['title'] as string).trim(),
      capacity: Number(value['capacity']),
      startDate,
      endDate,
      location: (value['location'] as string)?.trim() || null,
      description: description || null,
      imageUrl: null
    };

    const imageFile = this.eventImage;
    const sessionsToCreate = this.sessions.filter(s => (s.title ?? '').trim().length >= 3);

    this.eventRepository.create(dto).pipe(
      finalize(() => { if (sessionsToCreate.length === 0 && !imageFile) this.isLoading = false; })
    ).subscribe({
      next: (event) => {
        this.store.addEvent(event);
        const doImageAndNavigate = () => {
          if (imageFile) {
            this.isLoading = true;
            this.eventRepository.uploadImage(event.id, imageFile).pipe(
              finalize(() => { this.isLoading = false; })
            ).subscribe({
              next: (updated) => {
                this.store.updateEvent(updated);
                this.toast.success(this.transloco.translate('dashboard.toastCreatedWithImage'));
                this.router.navigate(['/dashboard/organizer']);
              },
              error: () => {
                this.toast.success(this.transloco.translate('dashboard.toastCreatedImageFailed'));
                this.router.navigate(['/dashboard/organizer']);
              }
            });
          } else {
            this.toast.success(this.transloco.translate('dashboard.toastCreated'));
            this.router.navigate(['/dashboard/organizer']);
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
          capacity: Number(s.capacity) || 1,
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
            const detail = typeof err?.error?.detail === 'string' ? err.error.detail : null;
            this.globalError = detail ?? err?.message ?? this.transloco.translate('dashboard.formErrorSessionCreate');
          }
        });
      },
      error: (err: { error?: { detail?: unknown }; message?: string }) => {
        this.isLoading = false;
        const detail = typeof err?.error?.detail === 'string' ? err.error.detail : null;
        this.globalError = detail ?? err?.message ?? this.transloco.translate('dashboard.formErrorCreate');
      }
    });
  }
}
