import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Event } from '@core/domain/entities/event.entity';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  dayNumber: number;
  dotColors: string[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  events = input<Event[]>([]);
  selectedDate = input<Date | null>(null);
  dateSelected = output<Date>();

  currentMonth = signal<number>(new Date().getMonth());
  currentYear = signal<number>(new Date().getFullYear());

  private readonly dotColorByIndex = ['bg-accent-cyan', 'bg-fuchsia-400'];

  private eventsByDate = computed(() => {
    const list = this.events() ?? [];
    const map = new Map<string, string[]>();
    for (const e of list) {
      const d = e.startDate instanceof Date ? e.startDate : new Date(e.startDate);
      const key = this.dateKey(d);
      if (!map.has(key)) map.set(key, []);
      const colors = map.get(key)!;
      const color =
        this.dotColorByIndex[colors.length % this.dotColorByIndex.length];
      if (!colors.includes(color)) colors.push(color);
    }
    return map;
  });

  weekDayKeys = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;

  calendarGrid = computed(() => {
    const month = this.currentMonth();
    const year = this.currentYear();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = first.getDay();
    const daysInMonth = last.getDate();
    const prevMonthLast = new Date(year, month, 0).getDate();
    const rows: CalendarDay[][] = [];
    let row: CalendarDay[] = [];
    for (let i = 0; i < startWeekday; i++) {
      const dayNum = prevMonthLast - startWeekday + 1 + i;
      const date = new Date(year, month - 1, dayNum);
      row.push({
        date,
        isCurrentMonth: false,
        dayNumber: dayNum,
        dotColors: this.getDotColorsForDate(date),
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      row.push({
        date,
        isCurrentMonth: true,
        dayNumber: d,
        dotColors: this.getDotColorsForDate(date),
      });
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
    }
    if (row.length > 0) {
      let nextD = 1;
      while (row.length < 7) {
        const date = new Date(year, month + 1, nextD);
        row.push({
          date,
          isCurrentMonth: false,
          dayNumber: nextD,
          dotColors: this.getDotColorsForDate(date),
        });
        nextD++;
      }
      rows.push(row);
    }
    return rows;
  });

  monthLabel = computed(() => {
    const m = this.currentMonth();
    const y = this.currentYear();
    const d = new Date(y, m, 1);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  });

  constructor() {
    effect(() => {
      const sel = this.selectedDate();
      if (sel) {
        this.currentMonth.set(sel.getMonth());
        this.currentYear.set(sel.getFullYear());
      }
    });
  }

  private dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private getDotColorsForDate(date: Date): string[] {
    const key = this.dateKey(date);
    return this.eventsByDate().get(key) ?? [];
  }

  isSelected(day: CalendarDay): boolean {
    const sel = this.selectedDate();
    if (!sel) return false;
    return (
      day.date.getDate() === sel.getDate() &&
      day.date.getMonth() === sel.getMonth() &&
      day.date.getFullYear() === sel.getFullYear()
    );
  }

  isToday(day: CalendarDay): boolean {
    const t = new Date();
    return (
      day.date.getDate() === t.getDate() &&
      day.date.getMonth() === t.getMonth() &&
      day.date.getFullYear() === t.getFullYear()
    );
  }

  goPrevMonth(): void {
    const m = this.currentMonth();
    const y = this.currentYear();
    if (m === 0) {
      this.currentYear.set(y - 1);
      this.currentMonth.set(11);
    } else {
      this.currentMonth.set(m - 1);
    }
  }

  goNextMonth(): void {
    const m = this.currentMonth();
    const y = this.currentYear();
    if (m === 11) {
      this.currentYear.set(y + 1);
      this.currentMonth.set(0);
    } else {
      this.currentMonth.set(m + 1);
    }
  }

  selectDay(day: CalendarDay): void {
    this.dateSelected.emit(new Date(day.date));
  }
}
