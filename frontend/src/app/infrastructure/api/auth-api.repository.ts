import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthRepository } from '@core/domain/ports/auth.repository';
import { AuthResponse, RegisterResponse } from '@core/domain/entities/auth.entity';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthApiRepository implements AuthRepository {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password });
  }

  register(email: string, fullName: string, password: string, role: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { 
      email, 
      full_name: fullName, 
      password, 
      role 
    });
  }
}
