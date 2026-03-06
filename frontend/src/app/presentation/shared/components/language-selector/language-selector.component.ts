import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, TranslocoModule, ButtonComponent],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss'
})
export class LanguageSelectorComponent {
  private translocoService = inject(TranslocoService);
  isOpen = signal(false);

  languages = [
    { code: 'es', label: 'Español (ES)' },
    { code: 'en', label: 'English (EN)' }
  ];

  currentLang = signal(this.translocoService.getActiveLang());

  get currentLocaleLabel(): string {
    return this.languages.find(l => l.code === this.currentLang())?.label || 'Español (ES)';
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  changeLanguage(code: string) {
    this.translocoService.setActiveLang(code);
    this.currentLang.set(code);
    this.isOpen.set(false);
  }
}
