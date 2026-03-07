import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionRegistrationRepository } from '@core/domain/ports/session-registration.repository';
import { AuthStore } from '@core/application/store/auth.store';

@Injectable({
  providedIn: 'root'
})
export class UnregisterFromSessionUseCase {
  private sessionRegistrationRepository = inject(SessionRegistrationRepository);
  private authStore = inject(AuthStore);

  execute(sessionId: number): Observable<void> {
    const userId = this.authStore.userId();
    if (userId == null) {
      throw new Error('User must be authenticated to unregister from a session');
    }
    return this.sessionRegistrationRepository.unregisterFromSession(sessionId);
  }
}
