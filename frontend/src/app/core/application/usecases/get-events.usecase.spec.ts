import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { throwError } from 'rxjs';
import { GetEventsUseCase } from './get-events.usecase';
import { EventRepository } from '../../domain/ports/event.repository';
import { EventStore } from '../store/event.store';
import { Event } from '../../domain/entities/event.entity';

describe('GetEventsUseCase', () => {
  let useCase: GetEventsUseCase;
  let repositoryMock: any;
  let store: EventStore;

  const mockEvent: Event = {
    id: 1,
    title: 'Test',
    description: null,
    startDate: new Date(),
    endDate: new Date(),
    location: null,
    imageUrl: null,
    capacity: 10,
    status: 'PUBLISHED',
    organizerId: 1
  };

  beforeEach(() => {
    repositoryMock = {
      getAll: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        GetEventsUseCase,
        { provide: EventRepository, useValue: repositoryMock },
        EventStore
      ]
    });

    useCase = TestBed.inject(GetEventsUseCase);
    store = TestBed.inject(EventStore);
  });

  it('should fetch events and update store via setEvents', () => {
    repositoryMock.getAll.mockReturnValue(of({ items: [mockEvent], total: 1 }));
    vi.spyOn(store, 'setEvents');

    useCase.execute(0, 12, false).subscribe();

    expect(repositoryMock.getAll).toHaveBeenCalledWith(0, 12);
    expect(store.setEvents).toHaveBeenCalledWith([mockEvent], 1);
  });

  it('should fetch events and update store via appendEvents when append is true', () => {
    repositoryMock.getAll.mockReturnValue(of({ items: [mockEvent], total: 2 }));
    vi.spyOn(store, 'appendEvents');

    useCase.execute(12, 12, true).subscribe();

    expect(repositoryMock.getAll).toHaveBeenCalledWith(12, 12);
    expect(store.appendEvents).toHaveBeenCalledWith([mockEvent], 2);
  });

  it('should call setError in store when repository fails', () => {
    const errorMessage = 'API Error';
    repositoryMock.getAll.mockReturnValue({
      pipe: () => ({
        subscribe: (callbacks: any) => {
          if (callbacks.error) callbacks.error({ message: errorMessage });
          return { unsubscribe: () => {} };
        }
      })
    });
    
    // Simpler way with RxJS throwError
    repositoryMock.getAll.mockReturnValue(throwError(() => ({ message: errorMessage })));
    vi.spyOn(store, 'setError');

    useCase.execute().subscribe({
      error: () => {
        expect(store.setError).toHaveBeenCalledWith(errorMessage);
      }
    });
  });
});
