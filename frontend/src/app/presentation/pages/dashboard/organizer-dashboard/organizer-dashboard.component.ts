import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { EventStore } from '@core/application/store/event.store';
import { GetOrganizerEventsUseCase } from '@core/application/usecases/get-organizer-events.usecase';
import { LoadingContextService } from '@core/application/services/loading-context.service';
import { EventRepository } from '@core/domain/ports/event.repository';
import { Event } from '@core/domain/entities/event.entity';
import { ToastService } from '@core/application/services/toast.service';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

const EVENTS_CONTEXT = 'events';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TranslocoModule,
    ButtonComponent,
    ConfirmModalComponent
  ],
  templateUrl: './organizer-dashboard.component.html',
  styleUrl: './organizer-dashboard.component.scss'
})
export class OrganizerDashboardComponent implements OnInit {
  store = inject(EventStore);
  loadingContext = inject(LoadingContextService);
  private getOrganizerEventsUseCase = inject(GetOrganizerEventsUseCase);
  private eventRepository = inject(EventRepository);
  private toast = inject(ToastService);
  private transloco = inject(TranslocoService);

  actionLoadingId = signal<number | null>(null);
  eventIdToDelete = signal<number | null>(null);
  showDeleteConfirm = computed(() => this.eventIdToDelete() != null);
  eventsLoading = computed(() => this.loadingContext.loadingFor(EVENTS_CONTEXT)());
  eventsError = computed(() => this.loadingContext.errorFor(EVENTS_CONTEXT)());

  private now = new Date();
  private startOfMonth = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
  private endOfMonth = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0, 23, 59, 59);

  totalEvents = computed(() => this.store.events().length);

  upcomingThisMonth = computed(() =>
    this.store.events().filter(
      e => e.status !== 'CANCELLED' && e.startDate >= this.startOfMonth && e.startDate <= this.endOfMonth
    ).length
  );

  attendanceRate = computed(() => {
    const total = this.store.events().length;
    if (total === 0) return 0;
    return Math.min(92, 70 + Math.floor(total * 2));
  });

  upcomingEvents = computed(() => {
    const events = [...this.store.events()].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    return events.slice(0, 6);
  });

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents(append = false) {
    const { skip, limit } = this.store.pagination();
    const nextSkip = append ? skip + limit : 0;
    this.loadingContext.setError(EVENTS_CONTEXT, null);

    this.getOrganizerEventsUseCase.execute(nextSkip, limit).pipe(
      catchError(() => EMPTY)
    ).subscribe({
      next: (response) => {
        if (append) {
          this.store.appendEvents(response.items, response.total);
          this.store.setPagination(nextSkip, limit);
        } else {
          this.store.setEvents(response.items, response.total);
        }
      }
    });
  }

  publishEvent(event: Event) {
    this.actionLoadingId.set(event.id);
    this.eventRepository.publish(event.id).subscribe({
      next: (updated) => {
        this.store.updateEvent(updated);
        this.toast.success(this.transloco.translate('dashboard.toastEventPublished'));
        this.actionLoadingId.set(null);
      },
      error: (err) => {
        this.toast.error(err?.error?.detail ?? err?.message ?? this.transloco.translate('dashboard.toastPublishError'));
        this.actionLoadingId.set(null);
      }
    });
  }

  cancelEvent(event: Event) {
    this.actionLoadingId.set(event.id);
    this.eventRepository.cancel(event.id).subscribe({
      next: (updated) => {
        this.store.updateEvent(updated);
        this.toast.success(this.transloco.translate('dashboard.toastEventCancelled'));
        this.actionLoadingId.set(null);
      },
      error: (err) => {
        this.toast.error(err?.error?.detail ?? err?.message ?? this.transloco.translate('dashboard.toastCancelError'));
        this.actionLoadingId.set(null);
      }
    });
  }

  revertEventToDraft(event: Event) {
    this.actionLoadingId.set(event.id);
    this.eventRepository.revertToDraft(event.id).subscribe({
      next: (updated) => {
        this.store.updateEvent(updated);
        this.toast.success(this.transloco.translate('dashboard.toastRevertedToDraft'));
        this.actionLoadingId.set(null);
      },
      error: (err) => {
        this.toast.error(err?.error?.detail ?? err?.message ?? this.transloco.translate('dashboard.toastRevertError'));
        this.actionLoadingId.set(null);
      }
    });
  }

  isActionLoading(id: number): boolean {
    return this.actionLoadingId() === id;
  }

  openDeleteConfirm(eventId: number): void {
    this.eventIdToDelete.set(eventId);
  }

  closeDeleteConfirm(): void {
    this.eventIdToDelete.set(null);
  }

  confirmDelete(): void {
    const id = this.eventIdToDelete();
    if (id == null) return;
    this.eventIdToDelete.set(null);
    this.actionLoadingId.set(id);
    this.eventRepository.delete(id).subscribe({
      next: () => {
        this.store.removeEvent(id);
        this.toast.success(this.transloco.translate('dashboard.toastEventDeleted'));
        this.actionLoadingId.set(null);
      },
      error: (err: { error?: { detail?: unknown }; message?: string }) => {
        this.toast.error(typeof err?.error?.detail === 'string' ? err.error.detail : err?.message ?? this.transloco.translate('dashboard.formErrorLoadEvent'));
        this.actionLoadingId.set(null);
      }
    });
  }
}
