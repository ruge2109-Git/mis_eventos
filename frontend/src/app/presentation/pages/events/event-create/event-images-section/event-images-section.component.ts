import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ImgWithLoaderComponent } from '@shared/components/img-with-loader/img-with-loader.component';
import { ButtonComponent } from '@shared/components/button/button.component';

export interface AdditionalDisplayItem {
  url: string;
  isNew: boolean;
  index: number;
}

@Component({
  selector: 'app-event-images-section',
  standalone: true,
  imports: [CommonModule, TranslocoModule, ImgWithLoaderComponent, ButtonComponent],
  templateUrl: './event-images-section.component.html',
  styleUrl: './event-images-section.component.scss'
})
export class EventImagesSectionComponent {
  coverPreviewUrl = input<string | null>(null);
  savedUrls = input<string[]>([]);
  newPreviewUrls = input<string[]>([]);
  dragOver = input(false);

  coverChange = output<Event>();
  coverClear = output<void>();
  coverPreviewClick = output<string>();
  additionalFilesAdd = output<File[]>();
  additionalDrop = output<File[]>();
  dragOverChange = output<boolean>();
  removeNewAt = output<number>();
  removeSavedAt = output<number>();
  previewClick = output<string>();

  displayItems = computed<AdditionalDisplayItem[]>(() => {
    const saved = this.savedUrls().map((url, i) => ({ url, isNew: false, index: i }));
    const newOnes = this.newPreviewUrls().map((url, i) => ({ url, isNew: true, index: i }));
    return [...saved, ...newOnes];
  });

  onCoverChange(e: Event): void {
    this.coverChange.emit(e);
  }

  onAdditionalInputChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    const maxSize = 5 * 1024 * 1024;
    const list: File[] = [];
    for (const f of Array.from(files)) {
      if (f.size <= maxSize && f.type.startsWith('image/')) list.push(f);
    }
    if (list.length) this.additionalFilesAdd.emit(list);
    input.value = '';
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOverChange.emit(false);
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    const maxSize = 5 * 1024 * 1024;
    const list: File[] = [];
    for (const f of Array.from(files)) {
      if (f.size <= maxSize && f.type.startsWith('image/')) list.push(f);
    }
    if (list.length) this.additionalDrop.emit(list);
  }

  onDragover(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOverChange.emit(true);
  }

  onDragleave(): void {
    this.dragOverChange.emit(false);
  }

  onRemoveItem(e: MouseEvent, item: AdditionalDisplayItem): void {
    e.stopPropagation();
    if (item.isNew) this.removeNewAt.emit(item.index);
    else this.removeSavedAt.emit(item.index);
  }

  onItemPreviewClick(url: string): void {
    this.previewClick.emit(url);
  }
}
