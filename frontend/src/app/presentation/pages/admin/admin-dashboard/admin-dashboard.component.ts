import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { DatePipe } from '@angular/common';
import { GetAdminStatsUseCase } from '@core/application/usecases/get-admin-stats.usecase';
import { AdminRepository, TopAttendee } from '@core/domain/ports/admin.repository';
import { AdminStats } from '@core/domain/entities/admin-stats.entity';
import { Event } from '@core/domain/entities/event.entity';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, DatePipe, SearchBarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private getAdminStatsUseCase = inject(GetAdminStatsUseCase);
  private adminRepository = inject(AdminRepository);

  readonly pageSize = PAGE_SIZE;
  loading = signal(true);
  error = signal<string | null>(null);
  stats = signal<AdminStats | null>(null);

  topAttendees = signal<TopAttendee[]>([]);
  topAttendeesTotal = signal(0);
  topAttendeesSkip = signal(0);
  topAttendeesSearch = signal('');
  topAttendeesLoading = signal(false);

  upcomingEvents = signal<Event[]>([]);
  upcomingTotal = signal(0);
  upcomingSkip = signal(0);
  upcomingSearch = signal('');
  upcomingLoading = signal(false);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.error.set(null);
    this.getAdminStatsUseCase
      .execute()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: s => this.stats.set(s),
        error: () => this.error.set('admin.errorLoadStats')
      });
    this.loadTopAttendees();
    this.loadUpcomingEvents();
  }

  onTopAttendeesSearch(value: string): void {
    this.topAttendeesSearch.set(value?.trim() ?? '');
    this.topAttendeesSkip.set(0);
    this.loadTopAttendees();
  }

  loadTopAttendees(): void {
    this.topAttendeesLoading.set(true);
    this.adminRepository
      .getTopAttendees(
        this.topAttendeesSkip(),
        PAGE_SIZE,
        this.topAttendeesSearch() || undefined
      )
      .pipe(finalize(() => this.topAttendeesLoading.set(false)))
      .subscribe({
        next: res => {
          this.topAttendees.set(res.items);
          this.topAttendeesTotal.set(res.total);
        },
        error: () => {
          this.topAttendees.set([]);
          this.topAttendeesTotal.set(0);
        }
      });
  }

  topAttendeesCurrentPage(): number {
    const total = this.topAttendeesTotal();
    if (total === 0) return 0;
    return Math.floor(this.topAttendeesSkip() / PAGE_SIZE) + 1;
  }

  topAttendeesTotalPages(): number {
    return Math.max(1, Math.ceil(this.topAttendeesTotal() / PAGE_SIZE));
  }

  topAttendeesPageNumbers(): number[] {
    const total = this.topAttendeesTotalPages();
    const current = this.topAttendeesCurrentPage();
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

  topAttendeesGoToPage(page: number): void {
    if (page < 1 || page > this.topAttendeesTotalPages()) return;
    this.topAttendeesSkip.set((page - 1) * PAGE_SIZE);
    this.loadTopAttendees();
  }

  onUpcomingSearch(value: string): void {
    this.upcomingSearch.set(value?.trim() ?? '');
    this.upcomingSkip.set(0);
    this.loadUpcomingEvents();
  }

  loadUpcomingEvents(): void {
    this.upcomingLoading.set(true);
    this.adminRepository
      .getUpcomingEvents(
        this.upcomingSkip(),
        PAGE_SIZE,
        this.upcomingSearch() || undefined
      )
      .pipe(finalize(() => this.upcomingLoading.set(false)))
      .subscribe({
        next: res => {
          this.upcomingEvents.set(res.items);
          this.upcomingTotal.set(res.total);
        },
        error: () => {
          this.upcomingEvents.set([]);
          this.upcomingTotal.set(0);
        }
      });
  }

  upcomingCurrentPage(): number {
    const total = this.upcomingTotal();
    if (total === 0) return 0;
    return Math.floor(this.upcomingSkip() / PAGE_SIZE) + 1;
  }

  upcomingTotalPages(): number {
    return Math.max(1, Math.ceil(this.upcomingTotal() / PAGE_SIZE));
  }

  upcomingPageNumbers(): number[] {
    const total = this.upcomingTotalPages();
    const current = this.upcomingCurrentPage();
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

  upcomingGoToPage(page: number): void {
    if (page < 1 || page > this.upcomingTotalPages()) return;
    this.upcomingSkip.set((page - 1) * PAGE_SIZE);
    this.loadUpcomingEvents();
  }
}
