import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RegistrationRepository } from '@core/domain/ports/registration.repository';
import { AuthStore } from '@core/application/store/auth.store';

@Injectable({
  providedIn: 'root'
})
export class UnregisterFromEventUseCase {
  private registrationRepository = inject(RegistrationRepository);
  private authStore = inject(AuthStore);

  execute(eventId: number): Observable<void> {
    const userId = this.authStore.userId();
    if (userId == null) {
      throw new Error('User must be authenticated to unregister from an event');
    }
    return this.registrationRepository.unregisterFromEvent(eventId);
  }
}
