import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { FieldConfig } from './field-config';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dynamic-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss'
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input() fields: FieldConfig[] = [];
  @Input() submitLabel = 'Submit';
  @Input() isLoading = false;
  @Input() globalError: string | null = null;
  @Output() formSubmit = new EventEmitter<Record<string, unknown>>();

  form: FormGroup;
  showPasswordMap = new Map<string, boolean>();
  private filePreviewUrls = new Map<string, string>();
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.form = this.fb.group({});
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] && !changes['fields'].firstChange && this.fields?.length !== undefined) {
      this.form = this.createControl();
      this.applyCrossFieldValidators();
    }
  }

  ngOnInit() {
    this.form = this.createControl();
    this.applyCrossFieldValidators();
  }

  createControl() {
    const group = this.fb.group({});
    this.fields.forEach(field => {
      const validators = field.validators ? [...field.validators] : [];
      if (field.required) {
        if (field.type === 'checkbox') {
          validators.push(Validators.requiredTrue);
        } else {
          validators.push(Validators.required);
        }
      }

      const defaultValue = field.value !== undefined
        ? field.value
        : (field.type === 'checkbox' ? false
          : field.type === 'radio-group' ? (field.options?.[0]?.value || '')
            : field.type === 'datetime-local' || field.type === 'textarea' ? ''
              : field.type === 'file' ? null
                : '');
      const control = this.fb.control(defaultValue, validators);
      group.addControl(field.name, control);

      if (field.type === 'password') {
        this.showPasswordMap.set(field.name, false);
      }
    });
    return group;
  }

  private applyCrossFieldValidators(): void {
    this.fields.forEach(field => {
      if (!field.equalTo) return;
      const control = this.form.get(field.name);
      const otherControl = this.form.get(field.equalTo);
      if (!control || !otherControl) return;

      const mustMatchValidator = (): ValidationErrors | null =>
        control.value === otherControl.value ? null : { mustMatch: true };

      control.addValidators(mustMatchValidator);
      control.updateValueAndValidity();
      otherControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => control.updateValueAndValidity());
    });
  }

  togglePasswordVisibility(fieldName: string) {
    this.showPasswordMap.set(fieldName, !this.showPasswordMap.get(fieldName));
  }

  isPasswordVisible(fieldName: string): boolean {
    return !!this.showPasswordMap.get(fieldName);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.form.valid) {
      const value = { ...this.form.value };
      this.formSubmit.emit(value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onFileChange(field: FieldConfig, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const control = this.form.get(field.name);
    if (!control) return;
    const oldUrl = this.filePreviewUrls.get(field.name);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      this.filePreviewUrls.delete(field.name);
    }
    if (file && field.maxSizeBytes && file.size > field.maxSizeBytes) {
      control.setValue(null);
      control.setErrors({ fileSizeMax: { max: field.maxSizeBytes } });
      control.markAsTouched();
      input.value = '';
      return;
    }
    control.setValue(file);
    control.setErrors(file ? null : control.errors);
    control.markAsTouched();
  }

  getFilePreviewUrl(field: FieldConfig): string | null {
    const control = this.form.get(field.name);
    const value = control?.value;
    if (!(value instanceof File) || !value.type.startsWith('image/')) return null;
    let url = this.filePreviewUrls.get(field.name);
    if (!url) {
      url = URL.createObjectURL(value);
      this.filePreviewUrls.set(field.name, url);
    }
    return url;
  }

  getErrorMessage(field: FieldConfig): string | null {
    const control = this.form.get(field.name);
    if (!control || !control.errors || !control.touched) return null;

    if (control.errors['required']) return field.errorMessages?.['required'] || 'Este campo es obligatorio.';
    if (control.errors['email']) return field.errorMessages?.['email'] || 'Correo electrónico no válido.';
    if (control.errors['minlength']) return field.errorMessages?.['minlength'] || `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.`;
    if (control.errors['maxlength']) return field.errorMessages?.['maxlength'] || `Debe tener menos de ${control.errors['maxlength'].requiredLength} caracteres.`;
    if (control.errors['pattern']) return field.errorMessages?.['pattern'] || 'El formato no es válido.';
    if (control.errors['mustMatch']) return field.errorMessages?.['mustMatch'] || 'Las contraseñas no coinciden.';
    if (control.errors['min']) return field.errorMessages?.['min'] || `El valor mínimo es ${control.errors['min'].min}.`;
    if (control.errors['fileSizeMax']) return field.errorMessages?.['fileSizeMax'] || `El archivo no debe superar ${(control.errors['fileSizeMax'].max / 1024 / 1024).toFixed(1)} MB.`;

    if (field.type === 'checkbox' && control.errors['required']) return field.errorMessages?.['required'] || 'Debe aceptar los términos.';

    const firstErrorKey = Object.keys(control.errors)[0];
    return field.errorMessages?.[firstErrorKey] || 'Dato inválido.';
  }
}
