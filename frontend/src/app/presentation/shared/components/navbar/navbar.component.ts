import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthStore } from '@core/application/store/auth.store';
import { ToastService } from '@core/application/services/toast.service';
import { canAccessOrganizerDashboard, canAccessAdminPanel, canAccessAssistantDashboard } from '@core/domain/constants/user-role';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, AvatarComponent, ButtonComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  authStore = inject(AuthStore);
  router = inject(Router);
  private toast = inject(ToastService);
  private transloco = inject(TranslocoService);

  isMobileMenuOpen = signal(false);

  showOrganizerNav = () => canAccessOrganizerDashboard(this.authStore.userRole());
  showAssistantNav = () => canAccessAssistantDashboard(this.authStore.userRole());
  showAdminNav = () => canAccessAdminPanel(this.authStore.userRole());

  toggleMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  logout() {
    this.authStore.logout();
    this.toast.success(this.transloco.translate('auth.toastSessionClosed'));
    this.router.navigate(['/auth/login']);
  }
}
