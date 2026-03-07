import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthRepository } from '@core/domain/ports/auth.repository';
import { AuthStorage } from '@core/domain/ports/auth-storage';
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

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private authRepository = inject(AuthRepository);
  private storage = inject(AuthStorage);
  private state = signal<AuthState>(this.getInitialState());

  private getInitialState(): AuthState {
    const token = this.storage.getToken();
    const userIdStr = this.storage.getUserId();
    return {
      isAuthenticated: !!token,
      accessToken: token,
      userId: userIdStr ? Number(userIdStr) : null,
      role: this.storage.getRole(),
      loading: false,
      error: null
    };
  }

  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly userRole = computed(() => this.state().role);
  readonly isLoading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  login(email: string, password: string): Observable<AuthResponse> {
    this.setLoading(true);
    return this.authRepository.login(email, password).pipe(
      tap({
        next: (res) => {
          this.storage.setToken(res.access_token);
          this.storage.setUserId(res.user_id.toString());
          this.storage.setRole(res.role);
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
    this.storage.clear();
    this.state.set({
      isAuthenticated: false,
      accessToken: null,
      userId: null,
      role: null,
      loading: false,
      error: null,
    });
  }

  setError(message: string | null): void {
    this.state.update((s) => ({ ...s, error: message }));
  }

  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }

  private setLoading(loading: boolean): void {
    this.state.update((s) => ({ ...s, loading, error: null }));
  }
}

