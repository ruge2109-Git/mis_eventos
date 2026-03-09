import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-event-create-header',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, ButtonComponent],
  templateUrl: './event-create-header.component.html',
  styleUrl: './event-create-header.component.scss'
})
export class EventCreateHeaderComponent {
  isEditMode = input.required<boolean>();
  isLoading = input(false);
  backLink = input<string[]>(['/dashboard/organizer']);

  deleteClick = output<void>();
}
