import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GetOrganizerEventsUseCase } from './get-organizer-events.usecase';
import { EventReader } from '@core/domain/ports/event-reader';
import { Event } from '@core/domain/entities/event.entity';
import { vi } from 'vitest';

describe('GetOrganizerEventsUseCase', () => {
  let useCase: GetOrganizerEventsUseCase;
  let repositoryMock: { getMine: ReturnType<typeof vi.fn> };

  const mockEvent: Event = {
    id: 1,
    title: 'My Event',
    description: null,
    startDate: new Date(),
    endDate: new Date(),
    location: null,
    imageUrl: null,
    additionalImages: [],
    capacity: 10,
    status: 'DRAFT',
    organizerId: 1
  };

  beforeEach(() => {
    repositoryMock = { getMine: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        GetOrganizerEventsUseCase,
        { provide: EventReader, useValue: repositoryMock }
      ]
    });

    useCase = TestBed.inject(GetOrganizerEventsUseCase);
  });

  it('should return observable from repository.getMine', () => {
    repositoryMock.getMine.mockReturnValue(of({ items: [mockEvent], total: 1 }));

    useCase.execute(0, 12).subscribe({
      next: (response) => {
        expect(repositoryMock.getMine).toHaveBeenCalledWith(0, 12, undefined);
        expect(response.items).toEqual([mockEvent]);
        expect(response.total).toBe(1);
      }
    });
  });

  it('should pass search to getMine when provided', () => {
    repositoryMock.getMine.mockReturnValue(of({ items: [], total: 0 }));
    useCase.execute(0, 12, 'tech').subscribe();
    expect(repositoryMock.getMine).toHaveBeenCalledWith(0, 12, 'tech');
  });

  it('should propagate error from repository', () => {
    const err = { error: { detail: 'Forbidden' }, message: 'Err' };
    repositoryMock.getMine.mockReturnValue(throwError(() => err));

    useCase.execute().subscribe({
      error: (e) => {
        expect(e).toEqual(err);
      }
    });
  });
});
