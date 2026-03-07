import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { ListAdminUsersUseCase } from '@core/application/usecases/list-admin-users.usecase';
import { UserRole } from '@core/domain/constants/user-role';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { UserDetailSidebarComponent } from '../admin-events/user-detail-sidebar/user-detail-sidebar.component';
import { AdminUser } from '@core/domain/entities/admin-user.entity';
import { finalize } from 'rxjs/operators';

const LIMIT = 10;

@Component({
  selector: 'app-admin-profiles',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    FormsModule,
    RoleBadgeComponent,
    SearchBarComponent,
    UserDetailSidebarComponent,
    DatePipe
  ],
  templateUrl: './admin-profiles.component.html',
  styleUrl: './admin-profiles.component.scss'
})
export class AdminProfilesComponent implements OnInit {
  private listAdminUsersUseCase = inject(ListAdminUsersUseCase);

  loading = signal(true);
  error = signal<string | null>(null);
  users = signal<AdminUser[]>([]);
  total = signal(0);
  skip = signal(0);
  search = signal('');
  roleFilter = signal<string>('');
  selectedUserId = signal<number | null>(null);

  currentPage = computed(() => Math.floor(this.skip() / LIMIT) + 1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / LIMIT)));
  showingText = computed(() => ({
    current: this.users().length,
    total: this.total()
  }));

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

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    const search = this.search().trim() || undefined;
    const role = this.roleFilter() || undefined;
    this.listAdminUsersUseCase
      .execute(this.skip(), LIMIT, search, role)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          this.users.set(res.items);
          this.total.set(res.total);
        },
        error: () => this.error.set('admin.errorLoadUsers')
      });
  }

  onSearchChange(value: string) {
    this.search.set(value);
    this.skip.set(0);
    this.load();
  }

  onRoleChange(value: string) {
    this.roleFilter.set(value);
    this.skip.set(0);
    this.load();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.skip.set((page - 1) * LIMIT);
    this.load();
  }

  openUserDetail(userId: number) {
    this.selectedUserId.set(userId);
  }

  closeUserSidebar() {
    this.selectedUserId.set(null);
  }

  trackByUserId(_: number, user: AdminUser) {
    return user.id;
  }

  readonly UserRole = UserRole;

  getInitials(user: AdminUser): string {
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return user.fullName.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase();
  }
}
