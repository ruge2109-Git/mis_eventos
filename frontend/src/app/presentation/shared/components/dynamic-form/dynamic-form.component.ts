import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class DynamicFormComponent implements OnInit {
  @Input() fields: FieldConfig[] = [];
  @Input() submitLabel: string = 'Submit';
  @Input() isLoading: boolean = false;
  @Input() globalError: string | null = null;
  @Output() formSubmit = new EventEmitter<any>();

  form: FormGroup;
  showPasswordMap: Map<string, boolean> = new Map();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
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

      const defaultValue = field.value !== undefined ? field.value : (field.type === 'checkbox' ? false : (field.type === 'radio-group' ? (field.options?.[0]?.value || '') : ''));
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
      otherControl.valueChanges.subscribe(() => control.updateValueAndValidity());
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
      this.formSubmit.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
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

    if (field.type === 'checkbox' && control.errors['required']) return field.errorMessages?.['required'] || 'Debe aceptar los términos.';

    const firstErrorKey = Object.keys(control.errors)[0];
    return field.errorMessages?.[firstErrorKey] || 'Dato inválido.';
  }
}
