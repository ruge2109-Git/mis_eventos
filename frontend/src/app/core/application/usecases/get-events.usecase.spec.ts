import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GetEventsUseCase } from './get-events.usecase';
import { EventReader } from '@core/domain/ports/event-reader';
import { Event } from '@core/domain/entities/event.entity';
import { vi } from 'vitest';

describe('GetEventsUseCase', () => {
  let useCase: GetEventsUseCase;
  let repositoryMock: { getAll: ReturnType<typeof vi.fn> };

  const mockEvent: Event = {
    id: 1,
    title: 'Test',
    description: null,
    startDate: new Date(),
    endDate: new Date(),
    location: null,
    imageUrl: null,
    additionalImages: [],
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
        { provide: EventReader, useValue: repositoryMock }
      ]
    });

    useCase = TestBed.inject(GetEventsUseCase);
  });

  it('should return observable from repository.getAll', () => {
    repositoryMock.getAll.mockReturnValue(of({ items: [mockEvent], total: 1 }));

    useCase.execute(0, 12).subscribe({
      next: (response) => {
        expect(repositoryMock.getAll).toHaveBeenCalledWith(0, 12);
        expect(response.items).toEqual([mockEvent]);
        expect(response.total).toBe(1);
      }
    });
  });

  it('should call repository with skip and limit', () => {
    repositoryMock.getAll.mockReturnValue(of({ items: [], total: 0 }));
    useCase.execute(5, 20).subscribe();
    expect(repositoryMock.getAll).toHaveBeenCalledWith(5, 20);
  });

  it('should propagate error from repository', () => {
    const err = { message: 'API Error' };
    repositoryMock.getAll.mockReturnValue(throwError(() => err));

    useCase.execute().subscribe({
      error: (e) => {
        expect(e).toEqual(err);
      }
    });
  });
});
