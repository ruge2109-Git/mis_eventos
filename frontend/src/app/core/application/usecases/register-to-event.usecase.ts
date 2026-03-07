import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Registration } from '@core/domain/entities/registration.entity';
import { RegistrationRepository } from '@core/domain/ports/registration.repository';
import { AuthStore } from '@core/application/store/auth.store';

@Injectable({
  providedIn: 'root'
})
export class RegisterToEventUseCase {
  private registrationRepository = inject(RegistrationRepository);
  private authStore = inject(AuthStore);

  execute(eventId: number): Observable<Registration> {
    const userId = this.authStore.userId();
    if (userId == null) {
      throw new Error('User must be authenticated to register for an event');
    }
    return this.registrationRepository.registerToEvent(eventId);
  }
}
