import { Injectable, inject } from '@angular/core';
import { Observable, of, from, throwError } from 'rxjs';
import { switchMap, concatMap, toArray, catchError } from 'rxjs/operators';
import { Event } from '@core/domain/entities/event.entity';
import { CreateEventDTO } from '@core/domain/entities/event.entity';
import { EventRepository } from '@core/domain/ports/event.repository';
import { CreateSessionsUseCase } from '@core/application/usecases/create-sessions.usecase';
import { SessionValidationService, SessionItemForValidation, SESSION_VALIDATION_KEYS } from '@core/application/services/session-validation.service';
import { stripBaseUrl } from '@core/application/utils/url.util';

export interface SaveEventParams {
  formValue: Record<string, unknown>;
  eventImage: File | null;
  additionalImages: File[];
  savedAdditionalUrls: string[];
  sessions: SessionItemForValidation[];
  isEditMode: boolean;
  eventId: number | null;
  apiBaseUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class SaveEventUseCase {
  private eventRepository = inject(EventRepository);
  private createSessionsUseCase = inject(CreateSessionsUseCase);
  private sessionValidation = inject(SessionValidationService);

  execute(params: SaveEventParams): Observable<Event> {
    const { formValue, eventImage, additionalImages, savedAdditionalUrls, sessions, isEditMode, eventId, apiBaseUrl } = params;

    const startDate = new Date(formValue['start_date'] as string);
    const endDate = new Date(formValue['end_date'] as string);
    if (endDate <= startDate) {
      return throwError(() => ({ message: 'dashboard.formErrorEndAfterStart' }));
    }

    const sessionErrorKey = this.sessionValidation.getValidationErrorKey(sessions, startDate, endDate);
    if (sessionErrorKey) {
      const msg = sessionErrorKey === SESSION_VALIDATION_KEYS.SPEAKER_REQUIRED
        ? `${SESSION_VALIDATION_KEYS.SPEAKER_REQUIRED}: ${SESSION_VALIDATION_KEYS.TITLE_REQUIRED}`
        : sessionErrorKey;
      return throwError(() => ({ message: msg }));
    }

    const description = (formValue['description'] as string)?.trim() || null;
    const dto: CreateEventDTO & { additionalImages?: string[] } = {
      title: (formValue['title'] as string).trim(),
      capacity: Number(formValue['capacity']),
      startDate,
      endDate,
      location: (formValue['location'] as string)?.trim() || null,
      description: description || null,
      imageUrl: null as string | null,
      additionalImages: []
    };
    if (isEditMode && savedAdditionalUrls.length > 0) {
      dto.additionalImages = savedAdditionalUrls
        .map(u => stripBaseUrl(u, apiBaseUrl))
        .filter(p => p.length > 0);
    }

    const sessionsToCreate = sessions.filter(
      s => ((s.title ?? '').trim().length >= 3) && s.id == null
    );

    const doCreateOrUpdate = (): Observable<Event> =>
      isEditMode && eventId != null
        ? this.eventRepository.update(eventId, dto)
        : this.eventRepository.create(dto);

    return doCreateOrUpdate().pipe(
      switchMap(event => {
        if (sessionsToCreate.length === 0) return of(event);
        const sessionDtos = sessionsToCreate.map(s => ({
          title: (s.title ?? '').trim(),
          startTime: new Date(s.start_time!),
          endTime: new Date(s.end_time!),
          speaker: (s.speaker ?? '').trim(),
          eventId: event.id,
          description: (s.description ?? '').trim() || undefined
        }));
        return this.createSessionsUseCase.execute(sessionDtos).pipe(
          switchMap(() => of(event))
        );
      }),
      switchMap(event => {
        if (eventImage) {
          return this.eventRepository.uploadImage(event.id, eventImage).pipe(
            catchError(() => of(event))
          );
        }
        return of(event);
      }),
      switchMap(event => {
        if (additionalImages.length === 0) return of(event);
        return from(additionalImages).pipe(
          concatMap(file => this.eventRepository.uploadAdditionalImage(event.id, file)),
          toArray(),
          switchMap(results => of(results.length ? results[results.length - 1] : event)),
          catchError(() => of(event))
        );
      })
    );
  }
}
