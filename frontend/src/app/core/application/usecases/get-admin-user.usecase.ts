import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminRepository } from '@core/domain/ports/admin.repository';
import { AdminUser } from '@core/domain/entities/admin-user.entity';

@Injectable({ providedIn: 'root' })
export class GetAdminUserUseCase {
  private adminRepository = inject(AdminRepository);

  execute(userId: number): Observable<AdminUser> {
    return this.adminRepository.getUserById(userId);
  }
}
