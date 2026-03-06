import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { organizerGuard } from './organizer.guard';
import { AuthStore } from '@core/application/store/auth.store';
import { vi } from 'vitest';

function createAuthStoreMock(authenticated: boolean, role: string | null) {
  return {
    isAuthenticated: () => authenticated,
    userRole: () => role
  };
}

describe('organizerGuard', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigate: vi.fn() };
  });

  it('should allow access when authenticated as Organizer', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: createAuthStoreMock(true, 'Organizer') },
        { provide: Router, useValue: router }
      ]
    });

    const result = TestBed.runInInjectionContext(() => organizerGuard(null!, null!));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow access when authenticated as Admin', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: createAuthStoreMock(true, 'Admin') },
        { provide: Router, useValue: router }
      ]
    });

    const result = TestBed.runInInjectionContext(() => organizerGuard(null!, null!));

    expect(result).toBe(true);
  });

  it('should redirect to login when not authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: createAuthStoreMock(false, null) },
        { provide: Router, useValue: router }
      ]
    });

    TestBed.runInInjectionContext(() => organizerGuard(null!, null!));

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should redirect to home when authenticated but not Organizer/Admin', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: createAuthStoreMock(true, 'Attendee') },
        { provide: Router, useValue: router }
      ]
    });

    TestBed.runInInjectionContext(() => organizerGuard(null!, null!));

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
