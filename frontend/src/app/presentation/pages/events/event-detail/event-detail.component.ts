import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';
import { EventReader } from '@core/domain/ports/event-reader';
import { SessionRepository } from '@core/domain/ports/session.repository';
import { GetMyRegistrationsUseCase } from '@core/application/usecases/get-my-registrations.usecase';
import { RegisterToEventUseCase } from '@core/application/usecases/register-to-event.usecase';
import { UnregisterFromEventUseCase } from '@core/application/usecases/unregister-from-event.usecase';
import { AuthStore } from '@core/application/store/auth.store';
import { ToastService } from '@core/application/services/toast.service';
import { Event } from '@core/domain/entities/event.entity';
import { Session } from '@core/domain/entities/session.entity';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export type TimelineItem =
  | { type: 'session'; session: Session }
  | { type: 'recess'; start: Date; end: Date };

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, ButtonComponent, TruncatePipe],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss'
})
export class EventDetailComponent implements OnInit {
  private eventReader = inject(EventReader);
  private sessionRepository = inject(SessionRepository);
  private getMyRegistrations = inject(GetMyRegistrationsUseCase);
  private registerToEvent = inject(RegisterToEventUseCase);
  private unregisterFromEvent = inject(UnregisterFromEventUseCase);
  private authStore = inject(AuthStore);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  event = signal<Event | null>(null);
  sessions = signal<Session[]>([]);
  myEventRegistration = signal<boolean>(false);
  loading = signal(true);
  actionLoading = signal<string | null>(null);
  descriptionExpanded = signal(false);
  readonly descriptionTruncateLimit = 400;
  /** Lightbox: index of additional image being viewed, or null if closed */
  lightboxIndex = signal<number | null>(null);
  /** Modal de confirmación: 'register' | 'unregister' | null */
  confirmModal = signal<'register' | 'unregister' | null>(null);

  /** Sesiones ordenadas por hora + recesos (tiempos muertos) entre sesiones */
  timelineItems = computed((): TimelineItem[] => {
    const list = this.sessions();
    const sorted = [...list].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const items: TimelineItem[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prevEnd = new Date(sorted[i - 1].endTime).getTime();
        const currStart = new Date(sorted[i].startTime).getTime();
        if (currStart > prevEnd) {
          items.push({ type: 'recess', start: new Date(prevEnd), end: new Date(currStart) });
        }
      }
      items.push({ type: 'session', session: sorted[i] });
    }
    return items;
  });

  isAuthenticated = computed(() => this.authStore.isAuthenticated());
  canRegister = computed(() => {
    const e = this.event();
    if (!e || e.status !== 'PUBLISHED' || !this.isAuthenticated() || this.myEventRegistration()) return false;
    const left = this.spotsLeft(e);
    return left > 0;
  });

  toggleDescription(): void {
    this.descriptionExpanded.update(v => !v);
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  lightboxPrev(): void {
    const ev = this.event();
    const imgs = ev?.additionalImages ?? [];
    const idx = this.lightboxIndex();
    if (idx === null || imgs.length === 0) return;
    this.lightboxIndex.set(idx <= 0 ? imgs.length - 1 : idx - 1);
  }

  lightboxNext(): void {
    const ev = this.event();
    const imgs = ev?.additionalImages ?? [];
    const idx = this.lightboxIndex();
    if (idx === null || imgs.length === 0) return;
    this.lightboxIndex.set(idx >= imgs.length - 1 ? 0 : idx + 1);
  }

  capacityPercent(ev: Event): number {
    if (ev.capacity <= 0) return 0;
    const registered = ev.registeredCount ?? 0;
    return Math.min(100, (registered / ev.capacity) * 100);
  }

  spotsLeft(ev: Event): number {
    const registered = ev.registeredCount ?? 0;
    return Math.max(0, ev.capacity - registered);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const eventId = Number(id);
    if (Number.isNaN(eventId)) return;

    this.loading.set(true);
    this.eventReader.getById(eventId).pipe(
      catchError(() => of(null))
    ).subscribe(ev => {
      this.event.set(ev);
      this.loading.set(false);
      if (ev) {
        this.sessionRepository.getByEventId(ev.id).pipe(catchError(() => of([]))).subscribe(s => this.sessions.set(s));
      }
    });

    if (this.authStore.isAuthenticated()) {
      this.getMyRegistrations.execute().pipe(catchError(() => of([]))).subscribe(regs => {
        const has = regs.some(r => r.eventId === eventId);
        this.myEventRegistration.set(has);
      });
    }
  }

  openConfirmRegister(): void {
    this.confirmModal.set('register');
  }

  openConfirmUnregister(): void {
    this.confirmModal.set('unregister');
  }

  closeConfirmModal(): void {
    this.confirmModal.set(null);
  }

  onConfirmRegister(): void {
    const e = this.event();
    if (!e || this.actionLoading()) return;
    this.actionLoading.set('event');
    this.registerToEvent.execute(e.id).pipe(
      catchError(err => {
        this.toast.error(err?.error?.detail ?? err?.message ?? 'No se pudo inscribir al evento');
        return of(null);
      })
    ).subscribe(result => {
      this.actionLoading.set(null);
      if (result) {
        this.confirmModal.set(null);
        this.myEventRegistration.set(true);
        this.event.update(ev => ev ? { ...ev, registeredCount: (ev.registeredCount ?? 0) + 1 } : null);
        this.toast.success('Te has inscrito al evento correctamente.');
      }
    });
  }

  onConfirmUnregister(): void {
    const e = this.event();
    if (!e || this.actionLoading()) return;
    this.actionLoading.set('event');
    this.unregisterFromEvent.execute(e.id).pipe(
      catchError(err => {
        this.toast.error(err?.error?.detail ?? err?.message ?? 'Error al cancelar inscripción');
        return of(null);
      })
    ).subscribe(() => {
      this.actionLoading.set(null);
      this.confirmModal.set(null);
      this.myEventRegistration.set(false);
      this.event.update(ev => ev ? { ...ev, registeredCount: Math.max(0, (ev.registeredCount ?? 0) - 1) } : null);
      this.toast.success('Inscripción cancelada.');
    });
  }
}
