import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionRegistration } from '@core/domain/entities/session-registration.entity';
import { SessionRegistrationRepository } from '@core/domain/ports/session-registration.repository';
import { AuthStore } from '@core/application/store/auth.store';

@Injectable({
  providedIn: 'root'
})
export class GetMySessionRegistrationsUseCase {
  private sessionRegistrationRepository = inject(SessionRegistrationRepository);
  private authStore = inject(AuthStore);

  execute(): Observable<SessionRegistration[]> {
    const userId = this.authStore.userId();
    if (userId == null) {
      throw new Error('User must be authenticated to list session registrations');
    }
    return this.sessionRegistrationRepository.getByUserId(userId);
  }
}
