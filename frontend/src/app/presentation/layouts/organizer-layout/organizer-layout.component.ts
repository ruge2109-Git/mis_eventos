import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { AuthStore } from '@core/application/store/auth.store';
import { ToastService } from '@core/application/services/toast.service';

@Component({
  selector: 'app-organizer-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoModule,
    AvatarComponent
  ],
  templateUrl: './organizer-layout.component.html',
  styleUrl: './organizer-layout.component.scss'
})
export class OrganizerLayoutComponent {
  private authStore = inject(AuthStore);
  private toast = inject(ToastService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  logout() {
    this.authStore.logout();
    this.toast.success(this.transloco.translate('auth.toastSessionClosed'));
    this.router.navigate(['/auth/login']);
  }
}
