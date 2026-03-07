import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-event-form-actions',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, ButtonComponent],
  templateUrl: './event-form-actions.component.html',
  styleUrl: './event-form-actions.component.scss'
})
export class EventFormActionsComponent {
  isLoading = input(false);
  isEditMode = input(false);
}
