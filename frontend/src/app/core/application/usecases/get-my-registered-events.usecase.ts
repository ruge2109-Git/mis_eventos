import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Event } from '@core/domain/entities/event.entity';
import { AuthStore } from '@core/application/store/auth.store';
import { RegistrationRepository } from '@core/domain/ports/registration.repository';

@Injectable({
  providedIn: 'root'
})
export class GetMyRegisteredEventsUseCase {
  private registrationRepository = inject(RegistrationRepository);
  private authStore = inject(AuthStore);

  execute(): Observable<Event[]> {
    const userId = this.authStore.userId();
    if (userId == null) {
      throw new Error('User must be authenticated to list registered events');
    }
    return this.registrationRepository.getRegisteredEventsByUserId(userId).pipe(
      catchError(() => of([]))
    );
  }
}
