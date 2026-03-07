import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { UserRole } from '@core/domain/constants/user-role';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './role-badge.component.html',
  styleUrl: './role-badge.component.scss'
})
export class RoleBadgeComponent {
  role = input.required<string>();

  readonly UserRole = UserRole;

  getRoleTranslationKey(role: string): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'roles.Admin';
      case UserRole.ORGANIZER:
        return 'roles.Organizer';
      case UserRole.ATTENDEE:
        return 'roles.Attendee';
      default:
        return 'roles.Attendee';
    }
  }
}
