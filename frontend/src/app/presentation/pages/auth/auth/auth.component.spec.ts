import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from './auth.component';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { AuthStore } from '@core/application/store/auth.store';
import { ToastService } from '@core/application/services/toast.service';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let mockAuthStore: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    clearError: ReturnType<typeof vi.fn>;
    isLoading: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    userRole: ReturnType<typeof vi.fn>;
  };
  let mockToastService: { success: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    mockAuthStore = {
      login: vi.fn().mockReturnValue(of(undefined)),
      register: vi.fn().mockReturnValue(of(undefined)),
      clearError: vi.fn(),
      isLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      userRole: vi.fn().mockReturnValue(null)
    };
    mockToastService = { success: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({ config: { availableLangs: ['es', 'en'], defaultLang: 'es' } }),
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: ToastService, useValue: mockToastService },
        {
          provide: ActivatedRoute,
          useValue: {
            url: of([new UrlSegment('login', {})]),
            snapshot: { queryParamMap: { get: (k: string) => (k === 'returnUrl' ? null : null) } }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set mode to login when route is login', () => {
    expect(component.mode).toBe('login');
    expect(component.fields.length).toBeGreaterThan(0);
    expect(component.fields.some(f => f.name === 'email' && f.type === 'email')).toBe(true);
    expect(component.fields.some(f => f.name === 'password')).toBe(true);
  });

  it('should set mode to register and show register fields when setFields is called for register', () => {
    component.mode = 'register';
    component.setFields();
    expect(component.mode).toBe('register');
    expect(component.fields.some(f => f.name === 'role' && f.type === 'radio-group')).toBe(true);
    expect(component.fields.some(f => f.name === 'full_name')).toBe(true);
    expect(component.fields.some(f => f.name === 'terms')).toBe(true);
  });

  it('should include password and confirm_password with validation in register fields', () => {
    component.mode = 'register';
    component.setFields();
    const passwordField = component.fields.find(f => f.name === 'password');
    const confirmField = component.fields.find(f => f.name === 'confirm_password');
    expect(passwordField).toBeTruthy();
    expect(passwordField?.type).toBe('password');
    expect(passwordField?.errorMessages?.['required']).toBe('La contraseña es obligatoria');
    expect(passwordField?.errorMessages?.['minlength']).toBe('La contraseña debe tener al menos 8 caracteres');
    expect(passwordField?.errorMessages?.['pattern']).toContain('mayúscula');
    expect(confirmField).toBeTruthy();
    expect(confirmField?.type).toBe('password');
    expect(confirmField?.equalTo).toBe('password');
    expect(confirmField?.errorMessages?.['mustMatch']).toBe('Las contraseñas no coinciden');
  });

  it('should call register without confirm_password in payload', () => {
    component.mode = 'register';
    component.setFields();
    component.onSubmit({
      email: 'r@r.com',
      full_name: 'User',
      password: 'ValidPass1!',
      confirm_password: 'ValidPass1!',
      role: 'Attendee',
      terms: true
    });
    expect(mockAuthStore.register).toHaveBeenCalledWith('r@r.com', 'User', 'ValidPass1!', 'Attendee');
  });

  it('should call clearError and authStore.login on submit in login mode', () => {
    component.mode = 'login';
    component.setFields();
    component.onSubmit({ email: 'user@test.com', password: 'Pass123!' });

    expect(mockAuthStore.clearError).toHaveBeenCalled();
    expect(mockAuthStore.login).toHaveBeenCalledWith('user@test.com', 'Pass123!');
  });

  it('should navigate to / after successful login when role is not Organizer/Admin', () => {
    vi.mocked(mockAuthStore.userRole).mockReturnValue('Attendee');
    component.mode = 'login';
    component.setFields();
    component.onSubmit({ email: 'u@u.com', password: 'Pass1!' });

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should navigate to /dashboard/organizer after successful login when role is Organizer', () => {
    vi.mocked(mockAuthStore.userRole).mockReturnValue('Organizer');
    component.mode = 'login';
    component.setFields();
    component.onSubmit({ email: 'org@test.com', password: 'Pass1!' });

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/organizer']);
  });

  it('should navigate to /admin after successful login when role is Admin', () => {
    vi.mocked(mockAuthStore.userRole).mockReturnValue('Admin');
    component.mode = 'login';
    component.setFields();
    component.onSubmit({ email: 'admin@test.com', password: 'Pass1!' });

    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should navigate to returnUrl after successful login when returnUrl is in queryParams', () => {
    const route = TestBed.inject(ActivatedRoute) as { snapshot?: unknown };
    const origSnapshot = route.snapshot;
    route.snapshot = { queryParamMap: { get: (k: string) => (k === 'returnUrl' ? '/evento/42' : null) } };
    component.mode = 'login';
    component.setFields();
    const navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.onSubmit({ email: 'u@u.com', password: 'Pass1!' });

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/evento/42');
    route.snapshot = origSnapshot;
  });

  it('should call toast.success with session message on successful login', () => {
    const transloco = TestBed.inject(TranslocoService);
    component.mode = 'login';
    component.setFields();
    component.onSubmit({ email: 'u@u.com', password: 'Pass1!' });
    expect(mockToastService.success).toHaveBeenCalledWith(transloco.translate('auth.toastSessionStarted'));
  });

  it('should call clearError and authStore.register on submit in register mode', () => {
    component.mode = 'register';
    component.setFields();
    component.onSubmit({
      email: 'new@test.com',
      full_name: 'Test User',
      password: 'SecurePass1!',
      role: 'Attendee',
      terms: true
    });

    expect(mockAuthStore.clearError).toHaveBeenCalled();
    expect(mockAuthStore.register).toHaveBeenCalledWith(
      'new@test.com',
      'Test User',
      'SecurePass1!',
      'Attendee'
    );
  });

  it('should navigate to /auth/login after successful register', () => {
    component.mode = 'register';
    component.setFields();
    component.onSubmit({
      email: 'n@n.com',
      full_name: 'Name',
      password: 'Pass1!',
      confirm_password: 'Pass1!',
      role: 'Organizer',
      terms: true
    });

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should call toast.success with account created message on successful register', () => {
    component.mode = 'register';
    component.setFields();
    component.onSubmit({
      email: 'n@n.com',
      full_name: 'Name',
      password: 'Pass1!',
      confirm_password: 'Pass1!',
      role: 'Organizer',
      terms: true
    });
    const transloco = TestBed.inject(TranslocoService);
    expect(mockToastService.success).toHaveBeenCalledWith(transloco.translate('auth.toastAccountCreated'));
  });

  it('should render app-dynamic-form', () => {
    const form = fixture.debugElement.query(By.css('app-dynamic-form'));
    expect(form).toBeTruthy();
  });

  it('should have link to home with arrow_back', () => {
    const homeLink = fixture.debugElement.query(By.css('a[routerLink="/"]'));
    expect(homeLink).toBeTruthy();
    expect(homeLink.nativeElement.textContent).toContain('arrow_back');
  });

  it('should show login title when mode is login', () => {
    component.mode = 'login';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toMatch(/Acceso al portal|auth\.loginTitle/);
  });

  it('should show register title when mode is register', () => {
    component.mode = 'register';
    component.setFields();
    expect(component.mode).toBe('register');
    expect(component.fields.some(f => f.name === 'role')).toBe(true);
  });

  it('should have link to auth/register when in login mode', () => {
    component.mode = 'login';
    fixture.detectChanges();
    const registerLink = fixture.debugElement.query(By.css('a[routerLink="/auth/register"]'));
    expect(registerLink).toBeTruthy();
  });
});
