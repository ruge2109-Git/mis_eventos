import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';

export interface SessionFormItem {
  id?: number;
  title: string;
  start_time: string;
  end_time: string;
  speaker: string;
  description: string;
}

@Component({
  selector: 'app-event-sessions-section',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, ButtonComponent],
  templateUrl: './event-sessions-section.component.html',
  styleUrl: './event-sessions-section.component.scss'
})
export class EventSessionsSectionComponent {
  sessions = input.required<SessionFormItem[]>();
  getSessionError = input.required<(index: number) => string | null>();

  addSession = output<void>();
  removeSession = output<number>();
}
