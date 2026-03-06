import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayout } from './main-layout.component';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthStore } from '@core/application/store/auth.store';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;
  let mockAuthStore: { isAuthenticated: ReturnType<typeof vi.fn>; userRole: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthStore = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      userRole: vi.fn().mockReturnValue(null),
      logout: vi.fn()
    };
    await TestBed.configureTestingModule({
      imports: [MainLayout, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: {
            availableLangs: ['es', 'en'],
            defaultLang: 'es',
          }
        }),
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain app-navbar', () => {
    const navbar = fixture.debugElement.query(By.css('app-navbar'));
    expect(navbar).toBeTruthy();
  });

  it('should contain router-outlet for child routes', () => {
    const outlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(outlet).toBeTruthy();
  });

  it('should contain app-footer', () => {
    const footer = fixture.debugElement.query(By.css('app-footer'));
    expect(footer).toBeTruthy();
  });
});
