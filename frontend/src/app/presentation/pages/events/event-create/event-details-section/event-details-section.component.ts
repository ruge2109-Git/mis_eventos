import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-event-details-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslocoModule],
  templateUrl: './event-details-section.component.html',
  styleUrl: './event-details-section.component.scss'
})
export class EventDetailsSectionComponent {
  form = input.required<FormGroup>();
}
