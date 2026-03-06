import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { AuthRepository } from '@core/domain/ports/auth.repository';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('AuthStore', () => {
  let store: AuthStore;
  let mockAuthRepository: { login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthRepository = {
      login: vi.fn().mockReturnValue(of({
        access_token: 'fake-token',
        token_type: 'bearer',
        user_id: 1,
        role: 'Attendee'
      })),
      register: vi.fn().mockReturnValue(of({ id: 1, email: 'user@test.com', message: 'User registered successfully' }))
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthRepository, useValue: mockAuthRepository }
      ]
    });
    store = TestBed.inject(AuthStore);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have isAuthenticated false initially when no token in localStorage', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.userRole()).toBeNull();
  });

  describe('login', () => {
    it('should call repository login with email and password', () => {
      store.login('user@test.com', 'password').subscribe();
      expect(mockAuthRepository.login).toHaveBeenCalledWith('user@test.com', 'password');
    });

    it('should update state and localStorage on successful login', () => {
      store.login('user@test.com', 'password').subscribe();

      expect(store.isAuthenticated()).toBe(true);
      expect(store.userRole()).toBe('Attendee');
      expect(store.error()).toBeNull();
      expect(localStorage.getItem('access_token')).toBe('fake-token');
      expect(localStorage.getItem('user_id')).toBe('1');
      expect(localStorage.getItem('user_role')).toBe('Attendee');
    });

    it('should set error and keep isAuthenticated false on login failure', () => {
      mockAuthRepository.login.mockReturnValueOnce(
        throwError(() => ({ error: { detail: 'Invalid credentials' }, message: 'Invalid credentials' }))
      );

      store.login('bad@test.com', 'wrong').subscribe({
        error: () => {}
      });

      expect(store.isAuthenticated()).toBe(false);
      expect(store.error()).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should call repository register with correct payload', () => {
      store
        .register('new@test.com', 'Full Name', 'SecurePass1!', 'Organizer')
        .subscribe();

      expect(mockAuthRepository.register).toHaveBeenCalledWith(
        'new@test.com',
        'Full Name',
        'SecurePass1!',
        'Organizer'
      );
    });

    it('should set error on register failure', () => {
      mockAuthRepository.register.mockReturnValueOnce(
        throwError(() => ({ error: { detail: 'Email already exists' } }))
      );

      store.register('existing@test.com', 'Name', 'Pass1!', 'Attendee').subscribe({
        error: () => {}
      });

      expect(store.error()).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should clear state and localStorage', () => {
      store.login('user@test.com', 'pass').subscribe();
      expect(store.isAuthenticated()).toBe(true);

      store.logout();

      expect(store.isAuthenticated()).toBe(false);
      expect(store.userRole()).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('user_id')).toBeNull();
      expect(localStorage.getItem('user_role')).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should set error to null', () => {
      mockAuthRepository.login.mockReturnValueOnce(
        throwError(() => ({ error: { detail: 'Error' } }))
      );
      store.login('x@x.com', 'wrong').subscribe({ error: () => {} });
      expect(store.error()).toBeTruthy();

      store.clearError();
      expect(store.error()).toBeNull();
    });
  });
});
