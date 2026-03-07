import { Component, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-img-with-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full min-h-[80px]">
      @if (!loaded() && !error()) {
        <div class="absolute inset-0 flex items-center justify-center bg-[#161a23]">
          <span class="material-symbols-outlined animate-spin text-3xl text-slate-500">progress_activity</span>
        </div>
      }
      @if (error()) {
        <div class="absolute inset-0 flex items-center justify-center bg-[#161a23] text-slate-500">
          <span class="material-symbols-outlined text-3xl">broken_image</span>
        </div>
      }
      <img [src]="src()"
           [alt]="alt()"
           [class]="imageClass()"
           class="w-full h-full transition-opacity duration-200"
           [class.object-cover]="objectFit() === 'cover'"
           [class.object-contain]="objectFit() === 'contain'"
           [class.opacity-0]="!loaded()"
           [class.invisible]="!loaded()"
           (load)="onLoad()"
           (error)="onError()" />
    </div>
  `,
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class ImgWithLoaderComponent {
  src = input.required<string>();
  alt = input<string>('');
  imageClass = input<string>('');
  objectFit = input<'cover' | 'contain'>('cover');

  loaded = signal(false);
  error = signal(false);

  constructor() {
    effect(() => {
      this.src();
      this.loaded.set(false);
      this.error.set(false);
    });
  }

  onLoad(): void {
    this.loaded.set(true);
    this.error.set(false);
  }

  onError(): void {
    this.loaded.set(true);
    this.error.set(true);
  }
}
