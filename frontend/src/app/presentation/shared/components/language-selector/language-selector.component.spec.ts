import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSelectorComponent } from './language-selector.component';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { vi } from 'vitest';

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let translocoService: TranslocoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: { availableLangs: ['es', 'en'], defaultLang: 'es' }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    translocoService = TestBed.inject(TranslocoService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle dropdown when toggleDropdown is called', () => {
    expect(component.isOpen()).toBe(false);
    component.toggleDropdown();
    expect(component.isOpen()).toBe(true);
    component.toggleDropdown();
    expect(component.isOpen()).toBe(false);
  });

  it('should show dropdown when isOpen is true', () => {
    component.toggleDropdown();
    fixture.detectChanges();
    const dropdown = fixture.debugElement.query(By.css('.absolute.bottom-full'));
    expect(dropdown).toBeTruthy();
  });

  it('should display both language options in dropdown', () => {
    component.toggleDropdown();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Español');
    expect(fixture.nativeElement.textContent).toContain('English');
  });

  it('should call changeLanguage and close dropdown when language is selected', () => {
    const setActiveLangSpy = vi.spyOn(translocoService, 'setActiveLang');
    component.toggleDropdown();
    fixture.detectChanges();
    component.changeLanguage('en');
    expect(setActiveLangSpy).toHaveBeenCalledWith('en');
    expect(component.currentLang()).toBe('en');
    expect(component.isOpen()).toBe(false);
  });

  it('should display currentLocaleLabel', () => {
    expect(component.currentLocaleLabel).toMatch(/Español|English/);
  });

  it('should have trigger button with language icon', () => {
    const trigger = fixture.debugElement.query(By.css('app-button'));
    expect(trigger).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('language');
  });
});
