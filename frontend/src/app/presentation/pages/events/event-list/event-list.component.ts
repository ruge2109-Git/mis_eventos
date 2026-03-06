import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { SearchBarComponent } from '@shared/components/search-bar/search-bar.component';
import { EventCardComponent } from '@shared/components/event-card/event-card.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { EventStore } from '@core/application/store/event.store';
import { GetEventsUseCase } from '@core/application/usecases/get-events.usecase';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, EventCardComponent, TranslocoModule, ButtonComponent],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss'
})
export class EventListComponent implements OnInit {
  public store = inject(EventStore);
  private getEventsUseCase = inject(GetEventsUseCase);

  searchQuery = signal<string>('');

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

  loadEvents(append: boolean = false) {
    const { skip, limit } = this.store.pagination();
    const nextSkip = append ? skip + limit : 0;
    
    if (append) {
      this.store.setPagination(nextSkip, limit);
    }

    this.getEventsUseCase.execute(nextSkip, limit, append).subscribe();
  }

  onLoadMore() {
    if (this.store.hasMore() && !this.store.loading()) {
      this.loadEvents(true);
    }
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }
}
