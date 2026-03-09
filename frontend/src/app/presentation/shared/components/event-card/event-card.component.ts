import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Event } from '@core/domain/entities/event.entity';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, ButtonComponent, TruncatePipe],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss'
})
export class EventCardComponent {
  private router = inject(Router);
  event = input.required<Event>();
  displayAsFeatured = input<boolean>(false);
  imageTakesHalf = input<boolean>(false);

  navigateToEvent(): void {
    this.router.navigate(['/evento', this.event().id.toString()]);
  }

  onCardKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToEvent();
    }
  }

  spotsLeft = computed(() => {
    const ev = this.event();
    const registered = ev.registeredCount ?? 0;
    return Math.max(0, ev.capacity - registered);
  });

  occupancyPercent = computed(() => {
    const ev = this.event();
    const registered = ev.registeredCount ?? 0;
    if (ev.capacity <= 0) return 0;
    return Math.min(100, (registered / ev.capacity) * 100);
  });

  isFeaturedLayout = computed(() => this.event().isFeatured === true || this.displayAsFeatured() === true);
}
