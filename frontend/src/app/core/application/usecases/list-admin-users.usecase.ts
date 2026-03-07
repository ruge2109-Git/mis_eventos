import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminRepository, PaginatedResponse } from '@core/domain/ports/admin.repository';
import { AdminUser } from '@core/domain/entities/admin-user.entity';

@Injectable({ providedIn: 'root' })
export class ListAdminUsersUseCase {
  private adminRepository = inject(AdminRepository);

  execute(
    skip: number,
    limit: number,
    search?: string,
    role?: string
  ): Observable<PaginatedResponse<AdminUser>> {
    return this.adminRepository.listUsers(skip, limit, search, role);
  }
}
