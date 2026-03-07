import { Component, input, output, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { GetAdminUserUseCase } from '@core/application/usecases/get-admin-user.usecase';
import { AdminRepository } from '@core/domain/ports/admin.repository';
import { AdminUser } from '@core/domain/entities/admin-user.entity';
import { AdminEventWithOrganizer } from '@core/domain/entities/admin-event-with-organizer.entity';
import { Event } from '@core/domain/entities/event.entity';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { finalize } from 'rxjs/operators';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-user-detail-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TranslocoModule,
    RoleBadgeComponent,
    SearchBarComponent
  ],
  templateUrl: './user-detail-sidebar.component.html',
  styleUrl: './user-detail-sidebar.component.scss'
})
export class UserDetailSidebarComponent {
  private getAdminUserUseCase = inject(GetAdminUserUseCase);
  private adminRepository = inject(AdminRepository);

  readonly pageSize = PAGE_SIZE;
  userId = input.required<number | null>();
  isOpen = input.required<boolean>();

  user = signal<AdminUser | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  eventsOrganized = signal<AdminEventWithOrganizer[]>([]);
  organizedTotal = signal(0);
  organizedSkip = signal(0);
  organizedSearch = signal('');
  organizedLoading = signal(false);
  eventsRegistered = signal<Event[]>([]);
  registeredTotal = signal(0);
  registeredSkip = signal(0);
  registeredSearch = signal('');
  registeredLoading = signal(false);

  closeRequested = output<void>();

  constructor() {
    effect(() => {
      const id = this.userId();
      const open = this.isOpen();
      if (open && id != null) {
        this.organizedSkip.set(0);
        this.organizedSearch.set('');
        this.registeredSkip.set(0);
        this.registeredSearch.set('');
        this.loadUser(id);
      } else {
        this.user.set(null);
        this.error.set(null);
        this.eventsOrganized.set([]);
        this.eventsRegistered.set([]);
      }
    });
  }

  private loadUser(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.getAdminUserUseCase.execute(id).subscribe({
      next: u => {
        this.user.set(u);
        this.loading.set(false);
        this.loadOrganized();
        this.loadRegistered();
      },
      error: () => {
        this.error.set('admin.errorLoadUsers');
        this.loading.set(false);
      }
    });
  }

  private loadOrganized() {
    const uid = this.userId();
    if (uid == null) return;
    this.organizedLoading.set(true);
    this.adminRepository
      .listAllEvents(
        this.organizedSkip(),
        PAGE_SIZE,
        this.organizedSearch() || undefined,
        undefined,
        uid
      )
      .pipe(finalize(() => this.organizedLoading.set(false)))
      .subscribe({
        next: res => {
          this.eventsOrganized.set(res.items);
          this.organizedTotal.set(res.total);
        },
        error: () => {
          this.eventsOrganized.set([]);
          this.organizedTotal.set(0);
        }
      });
  }

  private loadRegistered() {
    const uid = this.userId();
    if (uid == null) return;
    this.registeredLoading.set(true);
    this.adminRepository
      .getUserRegisteredEvents(
        uid,
        this.registeredSkip(),
        PAGE_SIZE,
        this.registeredSearch() || undefined
      )
      .pipe(finalize(() => this.registeredLoading.set(false)))
      .subscribe({
        next: res => {
          this.eventsRegistered.set(res.items);
          this.registeredTotal.set(res.total);
        },
        error: () => {
          this.eventsRegistered.set([]);
          this.registeredTotal.set(0);
        }
      });
  }

  onOrganizedSearch(value: string) {
    this.organizedSearch.set(value?.trim() ?? '');
    this.organizedSkip.set(0);
    this.loadOrganized();
  }

  organizedCurrentPage(): number {
    const total = this.organizedTotal();
    if (total === 0) return 0;
    return Math.floor(this.organizedSkip() / PAGE_SIZE) + 1;
  }

  organizedTotalPages(): number {
    return Math.max(1, Math.ceil(this.organizedTotal() / PAGE_SIZE));
  }

  organizedPageNumbers(): number[] {
    const total = this.organizedTotalPages();
    const current = this.organizedCurrentPage();
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

  organizedGoToPage(page: number) {
    if (page < 1 || page > this.organizedTotalPages()) return;
    this.organizedSkip.set((page - 1) * PAGE_SIZE);
    this.loadOrganized();
  }

  onRegisteredSearch(value: string) {
    this.registeredSearch.set(value?.trim() ?? '');
    this.registeredSkip.set(0);
    this.loadRegistered();
  }

  registeredCurrentPage(): number {
    const total = this.registeredTotal();
    if (total === 0) return 0;
    return Math.floor(this.registeredSkip() / PAGE_SIZE) + 1;
  }

  registeredTotalPages(): number {
    return Math.max(1, Math.ceil(this.registeredTotal() / PAGE_SIZE));
  }

  registeredPageNumbers(): number[] {
    const total = this.registeredTotalPages();
    const current = this.registeredCurrentPage();
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

  registeredGoToPage(page: number) {
    if (page < 1 || page > this.registeredTotalPages()) return;
    this.registeredSkip.set((page - 1) * PAGE_SIZE);
    this.loadRegistered();
  }

  close() {
    this.closeRequested.emit();
  }

  onBackdropClick() {
    this.close();
  }

  getInitials(u: AdminUser): string {
    const parts = u.fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return u.fullName.slice(0, 2).toUpperCase() || u.email.slice(0, 2).toUpperCase();
  }
}
