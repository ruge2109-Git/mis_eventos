import { Injectable, computed, signal } from '@angular/core';
import { Event } from '@core/domain/entities/event.entity';

export interface EventState {
  events: Event[];
  selectedEventId: number | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    skip: number;
    limit: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EventStore {
  // Private state using Signals
  private state = signal<EventState>({
    events: [],
    selectedEventId: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      skip: 0,
      limit: 12
    }
  });

  // Selectors (Computed Signals)
  events = computed(() => this.state().events);
  selectedEvent = computed(() =>
    this.state().events.find(e => e.id === this.state().selectedEventId) || null
  );
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  pagination = computed(() => this.state().pagination);
  hasMore = computed(() => {
    const total = this.state().pagination.total;
    const current = this.state().events.length;
    return total > 0 && current < total;
  });

  featuredEvents = computed(() =>
    this.state().events.filter(e => e.isFeatured)
  );

  // Actions
  setEvents(events: Event[], total: number) {
    this.state.update(s => ({
      ...s,
      events,
      error: null,
      pagination: { ...s.pagination, total },
      loading: false
    }));
  }

  appendEvents(events: Event[], total: number) {
    this.state.update(s => ({
      ...s,
      events: [...s.events, ...events],
      error: null,
      pagination: { ...s.pagination, total },
      loading: false
    }));
  }

  setPagination(skip: number, limit: number) {
    this.state.update(s => ({
      ...s,
      pagination: { ...s.pagination, skip, limit }
    }));
  }

  setSelectedEvent(id: number | null) {
    this.state.update(s => ({ ...s, selectedEventId: id }));
  }

  setLoading(loading: boolean) {
    this.state.update(s => ({ ...s, loading }));
  }

  setError(error: string | null) {
    this.state.update(s => ({ ...s, error, loading: false }));
  }

  addEvent(event: Event) {
    this.state.update(s => ({ ...s, events: [...s.events, event] }));
  }

  updateEvent(updatedEvent: Event) {
    this.state.update(s => ({
      ...s,
      events: s.events.map(e => e.id === updatedEvent.id ? updatedEvent : e)
    }));
  }

  removeEvent(id: number) {
    this.state.update(s => ({
      ...s,
      events: s.events.filter(e => e.id !== id)
    }));
  }
}
