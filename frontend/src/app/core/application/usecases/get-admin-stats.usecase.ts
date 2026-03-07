import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminRepository } from '@core/domain/ports/admin.repository';
import { AdminStats } from '@core/domain/entities/admin-stats.entity';

@Injectable({ providedIn: 'root' })
export class GetAdminStatsUseCase {
  private adminRepository = inject(AdminRepository);

  execute(): Observable<AdminStats> {
    return this.adminRepository.getStats();
  }
}
