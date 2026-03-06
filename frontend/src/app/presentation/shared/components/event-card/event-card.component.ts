import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '@core/domain/entities/event.entity';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  event = input.required<Event>();
}
