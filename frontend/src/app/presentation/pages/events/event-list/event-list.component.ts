import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { EventCardComponent } from '@shared/components/event-card/event-card.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { EventStore } from '@core/application/store/event.store';
import { GetEventsUseCase } from '@core/application/usecases/get-events.usecase';
import { LoadingContextService } from '@core/application/services/loading-context.service';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

const EVENTS_CONTEXT = 'events';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, EventCardComponent, TranslocoModule, ButtonComponent],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss'
})
export class EventListComponent implements OnInit {
  public store = inject(EventStore);
  public loadingContext = inject(LoadingContextService);
  private getEventsUseCase = inject(GetEventsUseCase);

  searchQuery = signal<string>('');
  eventsLoading = computed(() => this.loadingContext.loadingFor(EVENTS_CONTEXT)());
  eventsError = computed(() => this.loadingContext.errorFor(EVENTS_CONTEXT)());

  filteredEvents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const events = this.store.events();

    if (!query) return events;

    return events.filter(e =>
      e.title.toLowerCase().includes(query) ||
      (e.description?.toLowerCase().includes(query) ?? false)
    );
  });

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents(append = false) {
    const { skip, limit } = this.store.pagination();
    const nextSkip = append ? skip + limit : 0;
    this.loadingContext.setError(EVENTS_CONTEXT, null);

    this.getEventsUseCase.execute(nextSkip, limit).pipe(
      catchError(() => EMPTY)
    ).subscribe({
      next: (response) => {
        if (append) {
          this.store.appendEvents(response.items, response.total);
          this.store.setPagination(nextSkip, limit);
        } else {
          this.store.setEvents(response.items, response.total);
        }
      }
    });
  }

  onLoadMore() {
    if (this.store.hasMore() && !this.eventsLoading()) {
      this.loadEvents(true);
    }
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }
}
