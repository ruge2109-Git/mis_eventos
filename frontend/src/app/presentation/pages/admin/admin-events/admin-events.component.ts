import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { ListAdminEventsUseCase } from '@core/application/usecases/list-admin-events.usecase';
import { AdminEventWithOrganizer } from '@core/domain/entities/admin-event-with-organizer.entity';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { finalize } from 'rxjs/operators';
import { UserDetailSidebarComponent } from './user-detail-sidebar/user-detail-sidebar.component';

const LIMIT = 10;

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TranslocoModule,
    FormsModule,
    SearchBarComponent,
    UserDetailSidebarComponent
  ],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.scss'
})
export class AdminEventsComponent implements OnInit {
  private listAdminEventsUseCase = inject(ListAdminEventsUseCase);

  loading = signal(true);
  error = signal<string | null>(null);
  events = signal<AdminEventWithOrganizer[]>([]);
  selectedOrganizerId = signal<number | null>(null);
  total = signal(0);
  skip = signal(0);
  search = signal('');
  statusFilter = signal<string>('');

  currentPage = computed(() => Math.floor(this.skip() / LIMIT) + 1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / LIMIT)));
  /** Page numbers to show (1, …, current-1, current, current+1, …, last); -1 = ellipsis */
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
  showingText = computed(() => ({
    current: this.events().length,
    total: this.total()
  }));

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    const search = this.search().trim() || undefined;
    const status = this.statusFilter() || undefined;
    this.listAdminEventsUseCase
      .execute(this.skip(), LIMIT, search, status)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          this.events.set(res.items);
          this.total.set(res.total);
        },
        error: () => this.error.set('admin.errorLoadEvents')
      });
  }

  onSearchChange(value: string) {
    this.search.set(value);
    this.skip.set(0);
    this.load();
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
    this.skip.set(0);
    this.load();
  }

  goToPage(page: number) {
    this.skip.set((page - 1) * LIMIT);
    this.load();
  }

  trackByEventId(_: number, event: AdminEventWithOrganizer) {
    return event.id;
  }

  openOrganizerDetail(organizerId: number) {
    this.selectedOrganizerId.set(organizerId);
  }

  closeOrganizerSidebar() {
    this.selectedOrganizerId.set(null);
  }
}
