import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthRepository } from '@core/domain/ports/auth.repository';
import { AuthResponse, RegisterResponse } from '@core/domain/entities/auth.entity';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userId: number | null;
  role: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('access_token'),
  accessToken: localStorage.getItem('access_token'),
  userId: localStorage.getItem('user_id') ? Number(localStorage.getItem('user_id')) : null,
  role: localStorage.getItem('user_role'),
  loading: false,
  error: null,
};

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private authRepository = inject(AuthRepository);
  private state = signal<AuthState>(initialState);

  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly userRole = computed(() => this.state().role);
  readonly isLoading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  login(email: string, password: string): Observable<AuthResponse> {
    this.setLoading(true);
    return this.authRepository.login(email, password).pipe(
      tap({
        next: (res) => {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user_id', res.user_id.toString());
          localStorage.setItem('user_role', res.role);
          this.state.update((s) => ({
            ...s,
            isAuthenticated: true,
            accessToken: res.access_token,
            userId: res.user_id,
            role: res.role,
            loading: false,
            error: null,
          }));
        },
        error: (err) => {
          const message = typeof err?.message === 'string' ? err.message : (typeof err?.error?.detail === 'string' ? err.error.detail : 'Error al iniciar sesión');
          this.state.update((s) => ({ ...s, loading: false, error: message }));
        },
      })
    );
  }

  register(email: string, fullName: string, password: string, role: string): Observable<RegisterResponse> {
    this.setLoading(true);
    return this.authRepository.register(email, fullName, password, role).pipe(
      tap({
        next: () => this.setLoading(false),
        error: (err) => {
          const message = typeof err?.message === 'string' ? err.message : (typeof err?.error?.detail === 'string' ? err.error.detail : 'Error al registrar');
          this.state.update((s) => ({ ...s, loading: false, error: message }));
        },
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    this.state.set({
      isAuthenticated: false,
      accessToken: null,
      userId: null,
      role: null,
      loading: false,
      error: null,
    });
  }

  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }

  private setLoading(loading: boolean): void {
    this.state.update((s) => ({ ...s, loading, error: null }));
  }
}

