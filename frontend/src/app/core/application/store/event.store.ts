import { Injectable, computed, signal } from '@angular/core';
import { Event } from '../../domain/entities/event.entity';

export interface EventState {
  events: Event[];
  selectedEventId: string | null;
  loading: boolean;
  error: string | null;
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
    error: null
  });

  // Selectors (Computed Signals)
  events = computed(() => this.state().events);
  selectedEvent = computed(() => 
    this.state().events.find(e => e.id === this.state().selectedEventId) || null
  );
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  
  featuredEvents = computed(() => 
    this.state().events.filter(e => e.isFeatured)
  );

  // Actions
  setEvents(events: Event[]) {
    this.state.update(s => ({ ...s, events, loading: false }));
  }

  setSelectedEvent(id: string | null) {
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

  removeEvent(id: string) {
    this.state.update(s => ({
      ...s,
      events: s.events.filter(e => e.id !== id)
    }));
  }
}
