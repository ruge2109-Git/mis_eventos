import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { EventStore } from '@core/application/store/event.store';
import { GetOrganizerEventsUseCase } from '@core/application/usecases/get-organizer-events.usecase';
import { CalendarComponent } from '@shared/components/calendar/calendar.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslocoModule,
    CalendarComponent,
    ButtonComponent,
  ],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent implements OnInit {
  private store = inject(EventStore);
  private getOrganizerEventsUseCase = inject(GetOrganizerEventsUseCase);

  selectedDate = signal<Date>(new Date());
  selectedEventIndex = signal<number>(0);

  events = computed(() => this.store.events());

  eventsOfTheDay = computed(() => {
    const sel = this.selectedDate();
    const list = this.store.events();
    const selDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate());
    const nextDay = new Date(selDay);
    nextDay.setDate(nextDay.getDate() + 1);
    const onThatDay = list.filter((e) => {
      const start = e.startDate instanceof Date ? e.startDate : new Date(e.startDate);
      return start >= selDay && start < nextDay;
    });
    onThatDay.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    return onThatDay;
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
    this.getOrganizerEventsUseCase.execute(0, 200).subscribe();
  }

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    this.selectedEventIndex.set(0);
  }

  goToPrevEvent(): void {
    this.selectedEventIndex.update((i) => Math.max(0, i - 1));
  }

  goToNextEvent(): void {
    const max = this.eventsOfTheDay().length - 1;
    this.selectedEventIndex.update((i) => Math.min(max, i + 1));
  }
}
