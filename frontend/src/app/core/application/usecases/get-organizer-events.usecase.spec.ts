import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GetOrganizerEventsUseCase } from './get-organizer-events.usecase';
import { EventRepository } from '@core/domain/ports/event.repository';
import { EventStore } from '@core/application/store/event.store';
import { Event } from '@core/domain/entities/event.entity';
import { vi } from 'vitest';

describe('GetOrganizerEventsUseCase', () => {
  let useCase: GetOrganizerEventsUseCase;
  let repositoryMock: { getMine: ReturnType<typeof vi.fn> };
  let store: EventStore;

  const mockEvent: Event = {
    id: 1,
    title: 'My Event',
    description: null,
    startDate: new Date(),
    endDate: new Date(),
    location: null,
    imageUrl: null,
    capacity: 10,
    status: 'DRAFT',
    organizerId: 1
  };

  beforeEach(() => {
    repositoryMock = { getMine: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        GetOrganizerEventsUseCase,
        { provide: EventRepository, useValue: repositoryMock },
        EventStore
      ]
    });

    useCase = TestBed.inject(GetOrganizerEventsUseCase);
    store = TestBed.inject(EventStore);
  });

  it('should fetch organizer events and update store via setEvents', () => {
    repositoryMock.getMine.mockReturnValue(of({ items: [mockEvent], total: 1 }));
    vi.spyOn(store, 'setEvents');

    useCase.execute(0, 12, undefined, false).subscribe();

    expect(repositoryMock.getMine).toHaveBeenCalledWith(0, 12, undefined);
    expect(store.setEvents).toHaveBeenCalledWith([mockEvent], 1);
  });

  it('should pass search to getMine when provided', () => {
    repositoryMock.getMine.mockReturnValue(of({ items: [], total: 0 }));
    useCase.execute(0, 12, 'tech', false).subscribe();
    expect(repositoryMock.getMine).toHaveBeenCalledWith(0, 12, 'tech');
  });

  it('should append events when append is true', () => {
    repositoryMock.getMine.mockReturnValue(of({ items: [mockEvent], total: 2 }));
    vi.spyOn(store, 'appendEvents');

    useCase.execute(12, 12, undefined, true).subscribe();

    expect(repositoryMock.getMine).toHaveBeenCalledWith(12, 12, undefined);
    expect(store.appendEvents).toHaveBeenCalledWith([mockEvent], 2);
  });

  it('should set loading and call setError on failure', () => {
    const err = { error: { detail: 'Forbidden' }, message: 'Err' };
    repositoryMock.getMine.mockReturnValue(throwError(() => err));
    vi.spyOn(store, 'setError');

    useCase.execute().subscribe({ error: () => {} });

    expect(store.setError).toHaveBeenCalledWith('Forbidden');
  });
});
