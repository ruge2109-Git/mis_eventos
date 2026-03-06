import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';
import { DynamicFormComponent } from '@components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '@components/dynamic-form/field-config';
import { AuthStore } from '@core/application/store/auth.store';
import { ToastService } from '@core/application/services/toast.service';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterModule, DynamicFormComponent, TranslocoModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss' // Optional, can be empty
})
export class AuthComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  authStore = inject(AuthStore);
  private toast = inject(ToastService);

  mode: 'login' | 'register' = 'login';
  fields: FieldConfig[] = [];

  private loginFields: FieldConfig[] = [
    {
      name: 'email',
      label: 'Correo electrónico',
      type: 'email',
      icon: 'mail',
      required: true,
      placeholder: 'nombre@ejemplo.com',
      autocomplete: 'email',
      errorMessages: {
        required: 'El correo electrónico es obligatorio',
        email: 'Formato de correo inválido'
      }
    },
    {
      name: 'password',
      label: 'Contraseña',
      type: 'password',
      icon: 'lock',
      linkText: '¿Olvidaste tu contraseña?',
      linkUrl: '#',
      required: true,
      placeholder: '••••••••',
      autocomplete: 'current-password',
      errorMessages: {
        required: 'La contraseña es obligatoria'
      }
    },
    {
      name: 'remember',
      label: 'Mantener sesión iniciada',
      type: 'checkbox',
      required: false
    }
  ];

  private registerFields: FieldConfig[] = [
    {
      name: 'role',
      label: '', 
      type: 'radio-group',
      required: true,
      options: [
        { label: 'Asistente', value: 'Attendee', icon: 'person' },
        { label: 'Organizador', value: 'Organizer', icon: 'business_center' }
      ],
      errorMessages: {
        required: 'Debe seleccionar un perfil'
      }
    },
    {
      name: 'full_name',
      label: 'Nombre completo',
      type: 'text',
      icon: 'person',
      required: true,
      placeholder: 'Ej. Juan Pérez',
      autocomplete: 'name',
      errorMessages: {
        required: 'El nombre es obligatorio'
      }
    },
    {
      name: 'email',
      label: 'Correo electrónico',
      type: 'email',
      icon: 'mail',
      required: true,
      placeholder: 'nombre@ejemplo.com',
      autocomplete: 'email',
      errorMessages: {
        required: 'El correo electrónico es obligatorio',
        email: 'Formato de correo inválido'
      }
    },
    {
      name: 'password',
      label: 'Contraseña',
      type: 'password',
      icon: 'lock',
      required: true,
      validators: [Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,72}$/)],
      placeholder: 'Mínimo 8 caracteres, 1 mayús, 1 número, 1 símbolo',
      autocomplete: 'new-password',
      errorMessages: {
        required: 'La contraseña es obligatoria',
        minlength: 'La contraseña debe tener al menos 8 caracteres',
        pattern: 'Debe contener mayúscula, minúscula, número y símbolo especial'
      }
    },
    {
      name: 'confirm_password',
      label: 'Confirmar contraseña',
      type: 'password',
      icon: 'lock',
      required: true,
      equalTo: 'password',
      placeholder: 'Repite la contraseña',
      autocomplete: 'new-password',
      errorMessages: {
        required: 'Confirma tu contraseña',
        mustMatch: 'Las contraseñas no coinciden'
      }
    },
    {
      name: 'terms',
      label: 'Acepto los términos y condiciones',
      labelHtml: 'Acepto los <a href="#" class="text-[#3b82f6] hover:underline">términos y condiciones</a>',
      type: 'checkbox',
      required: true,
      errorMessages: {
        required: 'Es necesario aceptar los términos y condiciones para continuar'
      }
    }
  ];

  ngOnInit() {
    this.route.url.subscribe(segments => {
      this.mode = segments[0]?.path === 'register' ? 'register' : 'login';
      this.authStore.clearError();
      this.setFields();
    });
  }

  setFields() {
    if (this.mode === 'login') {
      this.fields = [...this.loginFields];
    } else {
      this.fields = [...this.registerFields];
    }
  }

  onSubmit(formData: any) {
    this.authStore.clearError();
    if (this.mode === 'login') {
      this.authStore.login(formData.email, formData.password).subscribe({
        next: () => {
          this.toast.success('Sesión iniciada');
          this.router.navigate(['/']);
        }
      });
    } else {
      this.authStore.register(formData.email, formData.full_name, formData.password, formData.role).subscribe({
        next: () => {
          this.toast.success('Cuenta creada. Ya puedes iniciar sesión.');
          this.router.navigate(['/auth/login']);
        }
      });
    }
  }
}
