import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ImgWithLoaderComponent } from '@shared/components/img-with-loader/img-with-loader.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-image-preview-modal',
  standalone: true,
  imports: [CommonModule, TranslocoModule, ImgWithLoaderComponent, ButtonComponent],
  templateUrl: './image-preview-modal.component.html',
  styleUrl: './image-preview-modal.component.scss'
})
export class ImagePreviewModalComponent {
  imageUrl = input<string | null>(null);
  close = output<void>();
}
