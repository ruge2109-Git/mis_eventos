import { Observable } from 'rxjs';
import { AuthResponse, RegisterResponse } from '@core/domain/entities/auth.entity';

export abstract class AuthRepository {
  abstract login(email: string, password: string): Observable<AuthResponse>;
  abstract register(email: string, fullName: string, password: string, role: string): Observable<RegisterResponse>;
}
