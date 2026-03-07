export interface SelectOption {
  label: string;
  value: string | number;
  icon?: string;
}

import type { ValidatorFn } from '@angular/forms';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'tel' | 'checkbox' | 'radio-group' | 'datetime-local' | 'textarea' | 'file';
  required?: boolean;
  value?: string | number | boolean | null;
  placeholder?: string;
  options?: SelectOption[];
  icon?: string;
  linkText?: string;
  linkUrl?: string;
  labelHtml?: string;
  validators?: ValidatorFn[];
  errorMessages?: Record<string, string>;
  equalTo?: string;
  autocomplete?: string;
  accept?: string;
  maxSizeBytes?: number;
  rows?: number;
}
