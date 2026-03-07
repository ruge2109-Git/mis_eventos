import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';
import { GetMyRegisteredEventsUseCase } from '@core/application/usecases/get-my-registered-events.usecase';
import { Event } from '@core/domain/entities/event.entity';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

type Tab = 'upcoming' | 'past';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, ButtonComponent],
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.scss'
})
export class MyEventsComponent implements OnInit {
  private getMyRegisteredEvents = inject(GetMyRegisteredEventsUseCase);
  private transloco = inject(TranslocoService);

  events = signal<Event[]>([]);
  loading = signal(true);
  activeTab = signal<Tab>('upcoming');

  upcomingEvents = computed(() => {
    const list = this.events();
    const now = new Date();
    return list.filter(e => new Date(e.startDate) >= now).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  });

  pastEvents = computed(() => {
    const list = this.events();
    const now = new Date();
    return list.filter(e => new Date(e.startDate) < now).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  });

  filteredEvents = computed(() =>
    this.activeTab() === 'upcoming' ? this.upcomingEvents() : this.pastEvents()
  );

  ngOnInit(): void {
    this.getMyRegisteredEvents.execute().pipe(
      catchError(() => of([]))
    ).subscribe(list => {
      this.events.set(list);
      this.loading.set(false);
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  eventStatusLabel(event: Event): string {
    const now = new Date();
    if (new Date(event.startDate) > now) return this.transloco.translate('assistant.statusUpcoming');
    if (new Date(event.endDate) < now) return this.transloco.translate('assistant.statusFinished');
    return this.transloco.translate('assistant.statusConfirmed');
  }
}
