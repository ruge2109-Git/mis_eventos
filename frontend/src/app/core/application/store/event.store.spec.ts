import { TestBed } from '@angular/core/testing';
import { EventStore } from './event.store';
import { Event } from '../../domain/entities/event.entity';

describe('EventStore', () => {
  let store: EventStore;

  const mockEvent: Event = {
    id: '1',
    title: 'Test Event',
    description: 'Description',
    date: new Date(),
    location: 'Place',
    imageUrl: 'img.jpg',
    capacity: 10,
    maxCapacity: 100,
    isOpen: true,
    status: 'published',
    organizerId: 'org1',
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

  it('should initialize with empty events', () => {
    expect(store.events()).toEqual([]);
  });

  it('should set events and clear loading', () => {
    store.setLoading(true);
    store.setEvents([mockEvent]);
    
    expect(store.events()).toEqual([mockEvent]);
    expect(store.loading()).toBe(false);
  });

  it('should add an event to the list', () => {
    store.setEvents([]);
    store.addEvent(mockEvent);
    
    expect(store.events().length).toBe(1);
    expect(store.events()[0].id).toBe('1');
  });

  it('should filter featured events', () => {
    const featuredEvent = { ...mockEvent, id: '2', isFeatured: true };
    store.setEvents([mockEvent, featuredEvent]);
    
    expect(store.featuredEvents().length).toBe(1);
    expect(store.featuredEvents()[0].id).toBe('2');
  });

  it('should set error and clear loading', () => {
    store.setLoading(true);
    store.setError('Something went wrong');
    
    expect(store.error()).toBe('Something went wrong');
    expect(store.loading()).toBe(false);
  });
});
