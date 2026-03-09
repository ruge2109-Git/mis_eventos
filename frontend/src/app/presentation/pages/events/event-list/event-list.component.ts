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
const PAGE_SIZE = 5; // 1 imagen grande (izq) + 4 cards (2 col x 2 filas) a la derecha

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    EventCardComponent,
    TranslocoModule,
    ButtonComponent,
  ],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
})
export class EventListComponent implements OnInit {
  public store = inject(EventStore);
  public loadingContext = inject(LoadingContextService);
  private getEventsUseCase = inject(GetEventsUseCase);

  searchQuery = signal('');
  currentPage = signal(1);
  eventsLoading = computed(() => this.loadingContext.loadingFor(EVENTS_CONTEXT)());
  eventsError = computed(() => this.loadingContext.errorFor(EVENTS_CONTEXT)());

  events = computed(() => this.store.events());
  total = computed(() => this.store.pagination().total);
  totalPages = computed(() => {
    const t = this.total();
    if (t <= 0) return 0;
    return Math.ceil(t / PAGE_SIZE);
  });
  featuredEvent = computed(() => {
    const list = this.events();
    return list.length > 0 ? list[0] : null;
  });
  restEvents = computed(() => this.events().slice(1));

  ngOnInit() {
    this.loadPage(1);
  }

  loadPage(page: number) {
    if (page < 1) return;
    const totalP = this.totalPages();
    if (totalP > 0 && page > totalP) return;
    this.currentPage.set(page);
    const skip = (page - 1) * PAGE_SIZE;
    this.loadingContext.setError(EVENTS_CONTEXT, null);
    this.getEventsUseCase
      .execute(skip, PAGE_SIZE, this.searchQuery() || undefined)
      .pipe(catchError(() => EMPTY))
      .subscribe({
        next: (response) => {
          this.store.setEvents(response.items, response.total);
          this.store.setPagination(skip, PAGE_SIZE);
        },
      });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.loadPage(1);
  }

  goToPage(page: number) {
    this.loadPage(page);
  }

  loadEvents() {
    this.loadPage(1);
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1); // ellipsis
    const from = Math.max(2, current - 1);
    const to = Math.min(total - 1, current + 1);
    for (let p = from; p <= to; p++) {
      if (!pages.includes(p)) pages.push(p);
    }
    if (current < total - 2) pages.push(-1);
    if (total > 1) pages.push(total);
    return pages.filter((p, i, arr) => p !== -1 || arr[i - 1] !== -1);
  }
}
