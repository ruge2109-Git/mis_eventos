import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminRepository, PaginatedResponse } from '@core/domain/ports/admin.repository';
import { AdminEventWithOrganizer } from '@core/domain/entities/admin-event-with-organizer.entity';

@Injectable({ providedIn: 'root' })
export class ListAdminEventsUseCase {
  private adminRepository = inject(AdminRepository);

  execute(
    skip: number,
    limit: number,
    search?: string,
    status?: string
  ): Observable<PaginatedResponse<AdminEventWithOrganizer>> {
    return this.adminRepository.listAllEvents(skip, limit, search, status);
  }
}
