import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CalendarComponent } from '@shared/components/calendar/calendar.component';
import { GetMyRegisteredEventsUseCase } from '@core/application/usecases/get-my-registered-events.usecase';
import { Event } from '@core/domain/entities/event.entity';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-assistant-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, ButtonComponent, CalendarComponent],
  templateUrl: './assistant-calendar.component.html',
  styleUrl: './assistant-calendar.component.scss'
})
export class AssistantCalendarComponent implements OnInit {
  private getMyRegisteredEvents = inject(GetMyRegisteredEventsUseCase);

  events = signal<Event[]>([]);
  selectedDate = signal<Date>(new Date());
  selectedEventIndex = signal<number>(0);
  loading = signal(true);

  eventsOfTheDay = computed(() => {
    const sel = this.selectedDate();
    const list = this.events();
    const dayStart = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return list
      .filter(e => {
        const start = new Date(e.startDate);
        return start >= dayStart && start < dayEnd;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  });

  currentEvent = computed(() => {
    const list = this.eventsOfTheDay();
    const idx = this.selectedEventIndex();
    if (list.length === 0) return null;
    return list[Math.min(idx, list.length - 1)] ?? null;
  });

  hasMultipleEvents = computed(() => this.eventsOfTheDay().length > 1);
  canGoPrev = computed(() => this.selectedEventIndex() > 0);
  canGoNext = computed(() => this.selectedEventIndex() < this.eventsOfTheDay().length - 1);

  ngOnInit(): void {
    this.loading.set(true);
    this.getMyRegisteredEvents.execute().pipe(catchError(() => of([]))).subscribe(evs => {
      this.events.set(evs);
      this.loading.set(false);
    });
  }

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    this.selectedEventIndex.set(0);
  }

  goToPrevEvent(): void {
    this.selectedEventIndex.update(i => Math.max(0, i - 1));
  }

  goToNextEvent(): void {
    const max = this.eventsOfTheDay().length - 1;
    this.selectedEventIndex.update(i => Math.min(max, i + 1));
  }
}
