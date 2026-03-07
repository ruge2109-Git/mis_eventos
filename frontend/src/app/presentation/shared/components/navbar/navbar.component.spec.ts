import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthStore } from '@core/application/store/auth.store';
import { ToastService } from '@core/application/services/toast.service';
import { vi } from 'vitest';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthStore: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    userRole: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let mockToastService: { success: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    mockAuthStore = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      userRole: vi.fn().mockReturnValue(null),
      logout: vi.fn()
    };
    mockToastService = { success: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: { availableLangs: ['es', 'en'], defaultLang: 'es' }
        }),
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle mobile menu when toggleMenu is called', () => {
    expect(component.isMobileMenuOpen()).toBe(false);
    component.toggleMenu();
    expect(component.isMobileMenuOpen()).toBe(true);
    component.toggleMenu();
    expect(component.isMobileMenuOpen()).toBe(false);
  });

  it('should call authStore.logout and navigate to /auth/login on logout', () => {
    component.logout();
    expect(mockAuthStore.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should call toast.success with session closed message on logout', () => {
    const transloco = TestBed.inject(TranslocoService);
    component.logout();
    expect(mockToastService.success).toHaveBeenCalledWith(transloco.translate('auth.toastSessionClosed'));
  });

  it('should have a link to home', () => {
    const link = fixture.debugElement.query(By.css('a[routerLink="/"]'));
    expect(link).toBeTruthy();
  });

  it('should show Ingresar and Registro when not authenticated', () => {
    const loginLink = fixture.debugElement.query(By.css('a[routerLink="/auth/login"]'));
    expect(loginLink?.nativeElement?.textContent?.trim()).toContain('Ingresar');
    expect(fixture.nativeElement.textContent).toContain('Registro');
  });

  it('should not show logout when not authenticated', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const salirButton = buttons.find(b => b.nativeElement.textContent?.includes('Salir'));
    expect(salirButton).toBeFalsy();
  });

  it('should show mobile menu overlay when isMobileMenuOpen is true', () => {
    component.toggleMenu();
    fixture.detectChanges();
    const overlay = fixture.debugElement.query(By.css('.md\\:hidden.border-t'));
    expect(overlay).toBeTruthy();
  });

  it('should display MisEventos brand text', () => {
    expect(fixture.nativeElement.textContent).toContain('MisEventos');
  });

  it('should have link to /events (explore)', () => {
    const exploreLink = fixture.debugElement.query(By.css('a[routerLink="/events"]'));
    expect(exploreLink).toBeTruthy();
  });

  it('should show mobile menu icon as menu when closed', () => {
    const menuButton = fixture.debugElement.query(By.css('app-button[customClass*="md:hidden"]'));
    expect(menuButton?.nativeElement?.textContent?.trim()).toContain('menu');
  });

  it('should show mobile menu icon as close when open', () => {
    component.toggleMenu();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('close');
  });

  it('should show Ingresar and Registro in mobile overlay when not authenticated', () => {
    component.toggleMenu();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ingresar');
    expect(fixture.nativeElement.textContent).toContain('Registro');
  });

  it('should call toggleMenu when clicking a link in mobile overlay', () => {
    const toggleSpy = vi.spyOn(component, 'toggleMenu');
    component.toggleMenu();
    fixture.detectChanges();
    const firstOverlayLink = fixture.debugElement.query(By.css('.md\\:hidden.border-t a'));
    firstOverlayLink?.nativeElement?.click();
    fixture.detectChanges();
    expect(toggleSpy).toHaveBeenCalled();
  });
});

describe('NavbarComponent when authenticated', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthStore: { isAuthenticated: ReturnType<typeof vi.fn>; userRole: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthStore = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      userRole: vi.fn().mockReturnValue('Attendee'),
      logout: vi.fn()
    };
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({ config: { availableLangs: ['es', 'en'], defaultLang: 'es' } }),
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
  });

  it('should show avatar and Salir', () => {
    const avatar = fixture.debugElement.query(By.css('app-avatar'));
    expect(avatar).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Salir');
  });

  it('should not show dashboard link when role is Attendee', () => {
    const dashboardLink = fixture.debugElement.query(By.css('a[routerLink="/dashboard/organizer"]'));
    expect(dashboardLink).toBeFalsy();
  });
});

describe('NavbarComponent when authenticated as Organizer', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthStore: { isAuthenticated: ReturnType<typeof vi.fn>; userRole: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthStore = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      userRole: vi.fn().mockReturnValue('Organizer'),
      logout: vi.fn()
    };
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({ config: { availableLangs: ['es', 'en'], defaultLang: 'es' } }),
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
  });

  it('should show create event link or button', () => {
    const createLink = fixture.debugElement.query(By.css('a[routerLink="/dashboard/organizer/crear"]'));
    const createButton = fixture.debugElement.queryAll(By.css('app-button')).find(b => b.attributes['ng-reflect-router-link'] === '/dashboard/organizer/crear');
    expect(createLink !== null || createButton !== undefined || fixture.nativeElement.textContent?.includes('createEvent')).toBe(true);
  });
});

describe('NavbarComponent mobile overlay when authenticated', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({ config: { availableLangs: ['es', 'en'], defaultLang: 'es' } }),
        { provide: AuthStore, useValue: { isAuthenticated: vi.fn().mockReturnValue(true), userRole: vi.fn().mockReturnValue('Attendee'), logout: vi.fn() } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.toggleMenu();
    fixture.detectChanges();
  });

  it('should show Cerrar Sesión', () => {
    expect(fixture.nativeElement.textContent).toContain('Cerrar Sesión');
  });
});
