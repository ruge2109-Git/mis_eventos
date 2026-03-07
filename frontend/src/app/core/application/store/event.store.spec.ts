import { TestBed } from '@angular/core/testing';
import { EventStore } from './event.store';
import { Event } from '@core/domain/entities/event.entity';

describe('EventStore', () => {
  let store: EventStore;

  const mockEvent: Event = {
    id: 1,
    title: 'Test Event',
    description: 'Description',
    startDate: new Date(),
    endDate: new Date(),
    location: 'Place',
    imageUrl: 'img.jpg',
    additionalImages: [],
    capacity: 10,
    status: 'PUBLISHED',
    organizerId: 101,
    category: 'Test'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventStore]
    });
    store = TestBed.inject(EventStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with empty events and default pagination', () => {
    expect(store.events()).toEqual([]);
    expect(store.pagination()).toEqual({
      total: 0,
      skip: 0,
      limit: 12
    });
  });

  it('should set events, total and clear loading', () => {
    store.setLoading(true);
    store.setEvents([mockEvent], 1);
    
    expect(store.events()).toEqual([mockEvent]);
    expect(store.pagination().total).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('should set error and clear loading', () => {
    store.setLoading(true);
    store.setError('Something went wrong');
    
    expect(store.error()).toBe('Something went wrong');
    expect(store.loading()).toBe(false);
  });

  it('should append events to the existing list', () => {
    store.setEvents([mockEvent], 2);
    const secondEvent = { ...mockEvent, id: 2 };
    store.appendEvents([secondEvent], 2);
    
    expect(store.events().length).toBe(2);
    expect(store.events()[1].id).toBe(2);
  });

  it('should set pagination skip and limit', () => {
    store.setPagination(12, 24);
    expect(store.pagination().skip).toBe(12);
    expect(store.pagination().limit).toBe(24);
  });

  it('should correctly calculate hasMore', () => {
    store.setEvents([mockEvent], 2);
    expect(store.hasMore()).toBe(true);
    
    const secondEvent = { ...mockEvent, id: 2 };
    store.appendEvents([secondEvent], 2);
    expect(store.hasMore()).toBe(false);
  });

  it('should filter featured events', () => {
    const featuredEvent = { ...mockEvent, id: 3, isFeatured: true };
    store.setEvents([mockEvent, featuredEvent], 2);
    
    expect(store.featuredEvents().length).toBe(1);
    expect(store.featuredEvents()[0].id).toBe(3);
  });

  it('should set selected event id', () => {
    store.setSelectedEvent(123);
    expect(store.selectedEvent()).toBeNull(); // Because event 123 is not in the list
    
    store.setEvents([mockEvent], 1);
    store.setSelectedEvent(1);
    expect(store.selectedEvent()).toEqual(mockEvent);
  });

  it('should add an event', () => {
    store.addEvent(mockEvent);
    expect(store.events()).toContain(mockEvent);
  });

  it('should update an existing event', () => {
    store.setEvents([mockEvent], 1);
    const updatedEvent = { ...mockEvent, title: 'Updated Title' };
    store.updateEvent(updatedEvent);
    
    expect(store.events()[0].title).toBe('Updated Title');
  });

  it('should remove an event by id', () => {
    store.setEvents([mockEvent], 1);
    store.removeEvent(1);
    expect(store.events().length).toBe(0);
  });
});
