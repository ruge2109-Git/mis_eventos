import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncates text to a maximum length and appends '...' when truncated.
 */
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit: number = 120): string {
    if (value == null || value === '') return '';
    if (value.length <= limit) return value;
    return value.slice(0, limit).trim() + '...';
  }
}
