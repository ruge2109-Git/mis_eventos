import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { EventStore } from '@core/application/store/event.store';
import { GetOrganizerEventsUseCase } from '@core/application/usecases/get-organizer-events.usecase';
import { LoadingContextService } from '@core/application/services/loading-context.service';
import { EventRepository } from '@core/domain/ports/event.repository';
import { Event } from '@core/domain/entities/event.entity';
import { ToastService } from '@core/application/services/toast.service';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

const EVENTS_CONTEXT = 'events';
const PAGE_SIZE = 12;

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TranslocoModule,
    ButtonComponent,
    ConfirmModalComponent,
    SearchBarComponent
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
  stateChangeConfirm = signal<{ type: 'publish' | 'cancel' | 'revert'; event: Event } | null>(null);
  showStateChangeConfirm = computed(() => this.stateChangeConfirm() != null);
  eventsLoading = computed(() => this.loadingContext.loadingFor(EVENTS_CONTEXT)());
  eventsError = computed(() => this.loadingContext.errorFor(EVENTS_CONTEXT)());

  searchQuery = signal('');
  currentPage = signal(1);

  statusFilter = signal<'PUBLISHED' | 'DRAFT' | 'CANCELLED' | null>(null);
  sortBy = signal<'date' | 'title'>('date');

  private now = new Date();
  private startOfMonth = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
  private endOfMonth = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0, 23, 59, 59);

  totalEvents = computed(() => this.store.events().length);
  publishedCount = computed(() => this.store.events().filter(e => e.status === 'PUBLISHED').length);
  draftCount = computed(() => this.store.events().filter(e => e.status === 'DRAFT').length);
  cancelledCount = computed(() => this.store.events().filter(e => e.status === 'CANCELLED').length);

  upcomingThisMonth = computed(() =>
    this.store.events().filter(
      e => e.status !== 'CANCELLED' && e.startDate >= this.startOfMonth && e.startDate <= this.endOfMonth
    ).length
  );

  filteredEvents = computed(() => {
    const filter = this.statusFilter();
    const list = this.store.events();
    if (!filter) return list;
    return list.filter(e => e.status === filter);
  });

  upcomingEvents = computed(() => {
    const list = [...this.filteredEvents()];
    const by = this.sortBy();
    if (by === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
    return list;
  });

  totalFromServer = computed(() => this.store.pagination().total);
  totalPages = computed(() => {
    const t = this.totalFromServer();
    if (t <= 0) return 0;
    return Math.ceil(t / PAGE_SIZE);
  });

  pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
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

  setStatusFilter(status: 'PUBLISHED' | 'DRAFT' | 'CANCELLED' | null): void {
    this.statusFilter.set(status);
  }

  setSortBy(value: 'date' | 'title'): void {
    this.sortBy.set(value);
  }

  stateChangeModalTitle = computed(() => {
    const t = this.transloco;
    const type = this.stateChangeConfirm()?.type;
    if (type === 'publish') return t.translate('dashboard.publishConfirmTitle');
    if (type === 'cancel') return t.translate('dashboard.cancelEventConfirmTitle');
    if (type === 'revert') return t.translate('dashboard.revertConfirmTitle');
    return '';
  });

  stateChangeModalMessage = computed(() => {
    const t = this.transloco;
    const type = this.stateChangeConfirm()?.type;
    if (type === 'publish') return t.translate('dashboard.publishConfirmMessage');
    if (type === 'cancel') return t.translate('dashboard.cancelEventConfirmMessage');
    if (type === 'revert') return t.translate('dashboard.revertConfirmMessage');
    return '';
  });

  ngOnInit() {
    this.loadPage(1);
  }

  loadPage(page: number) {
    if (page < 1) return;
    const totalP = this.totalPages();
    if (totalP > 0 && page > totalP) return;
    this.currentPage.set(page);
    const skip = (page - 1) * PAGE_SIZE;
    this.loadingContext.setError(EVENTS_CONTEXT, null);
    this.loadingContext.setLoading(EVENTS_CONTEXT, true);

    this.getOrganizerEventsUseCase
      .execute(skip, PAGE_SIZE, this.searchQuery() || undefined)
      .pipe(
        catchError(() => {
          this.loadingContext.setLoading(EVENTS_CONTEXT, false);
          return EMPTY;
        })
      )
      .subscribe({
        next: (response) => {
          this.store.setEvents(response.items, response.total);
          this.store.setPagination(skip, PAGE_SIZE);
          this.loadingContext.setLoading(EVENTS_CONTEXT, false);
        }
      });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.loadPage(1);
  }

  goToPage(page: number) {
    this.loadPage(page);
  }

  loadEvents() {
    this.loadPage(1);
  }

  openPublishConfirm(event: Event): void {
    this.stateChangeConfirm.set({ type: 'publish', event });
  }

  openCancelConfirm(event: Event): void {
    this.stateChangeConfirm.set({ type: 'cancel', event });
  }

  openRevertConfirm(event: Event): void {
    this.stateChangeConfirm.set({ type: 'revert', event });
  }

  closeStateChangeConfirm(): void {
    this.stateChangeConfirm.set(null);
  }

  confirmStateChange(): void {
    const payload = this.stateChangeConfirm();
    if (!payload) return;
    this.stateChangeConfirm.set(null);
    const { type, event } = payload;
    if (type === 'publish') this.publishEvent(event);
    else if (type === 'cancel') this.cancelEvent(event);
    else this.revertEventToDraft(event);
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
