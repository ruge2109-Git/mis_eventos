import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicFormComponent } from './dynamic-form.component';
import { FieldConfig } from './field-config';
import { By } from '@angular/platform-browser';
import { Validators } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

describe('DynamicFormComponent', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;

  const mockFields: FieldConfig[] = [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Password', type: 'password', required: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = mockFields;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build form controls from fields input', () => {
    expect(component.form.contains('email')).toBe(true);
    expect(component.form.contains('password')).toBe(true);
  });

  it('should emit formSubmit with form value when form is valid and submitted', () => {
    let emitted: unknown;
    component.formSubmit.subscribe((value) => (emitted = value));

    component.form.patchValue({ email: 'test@test.com', password: 'ValidPass1!' });
    component.onSubmit(new Event('submit'));

    expect(emitted).toEqual({ email: 'test@test.com', password: 'ValidPass1!' });
  });

  it('should not emit when form is invalid and should markAllAsTouched', () => {
    const spy = vi.fn();
    component.formSubmit.subscribe(spy);
    const markSpy = vi.spyOn(component.form, 'markAllAsTouched');

    component.onSubmit(new Event('submit'));

    expect(spy).not.toHaveBeenCalled();
    expect(markSpy).toHaveBeenCalled();
  });

  it('should toggle password visibility for a field', () => {
    expect(component.isPasswordVisible('password')).toBe(false);
    component.togglePasswordVisibility('password');
    expect(component.isPasswordVisible('password')).toBe(true);
    component.togglePasswordVisibility('password');
    expect(component.isPasswordVisible('password')).toBe(false);
  });

  it('should return error message for required field when touched', () => {
    const field: FieldConfig = { name: 'email', label: 'Email', type: 'email', required: true };
    component.form.get('email')?.setValue('');
    component.form.get('email')?.markAsTouched();
    component.form.get('email')?.updateValueAndValidity();

    const message = component.getErrorMessage(field);
    expect(message).toBeTruthy();
    expect(message).toContain('obligatorio');
  });

  it('should return null for getErrorMessage when control has no errors', () => {
    const field: FieldConfig = { name: 'email', label: 'Email', type: 'email', required: true };
    component.form.get('email')?.setValue('valid@email.com');
    component.form.get('email')?.markAsTouched();

    expect(component.getErrorMessage(field)).toBeNull();
  });

  it('should display globalError in template when set', () => {
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = mockFields;
    component.globalError = 'Invalid credentials';
    fixture.detectChanges();
    const alert = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(alert).toBeTruthy();
    expect(alert.nativeElement.textContent).toContain('Invalid credentials');
  });

  it('should disable submit button when isLoading is true', () => {
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = mockFields;
    component.isLoading = true;
    fixture.detectChanges();
    const submitBtn = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(submitBtn.nativeElement.disabled).toBe(true);
  });

  it('should show loading spinner in submit button when isLoading', () => {
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = mockFields;
    component.isLoading = true;
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.animate-spin'));
    expect(spinner).toBeTruthy();
  });

  it('should render link next to label when field has linkText and linkUrl', () => {
    const fieldsWithLink: FieldConfig[] = [
      { name: 'email', label: 'Email', type: 'email', linkText: 'Help', linkUrl: '/help' }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsWithLink;
    fixture.detectChanges();
    const links = fixture.debugElement.queryAll(By.css('a'));
    const helpLink = links.find(a => a.nativeElement.textContent?.trim() === 'Help');
    expect(helpLink).toBeTruthy();
    expect(helpLink?.attributes['ng-reflect-router-link'] || helpLink?.properties['href']).toBeTruthy();
  });

  it('should render checkbox with labelHtml when provided', () => {
    const fieldsCheckbox: FieldConfig[] = [
      { name: 'terms', label: 'Terms', type: 'checkbox', required: true, labelHtml: 'I accept <a href="#">terms</a>' }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsCheckbox;
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('label'));
    expect(label).toBeTruthy();
    expect(label.nativeElement.innerHTML).toContain('terms');
  });

  it('should render radio-group with options and emit selected value on submit', () => {
    const fieldsRadio: FieldConfig[] = [
      {
        name: 'role',
        label: 'Role',
        type: 'radio-group',
        required: true,
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'User', value: 'user', icon: 'person' }
        ]
      }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsRadio;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Admin');
    expect(fixture.nativeElement.textContent).toContain('User');
    component.form.patchValue({ role: 'user' });
    let emitted: unknown;
    component.formSubmit.subscribe((v: unknown) => (emitted = v));
    component.onSubmit(new Event('submit'));
    expect(emitted).toEqual({ role: 'user' });
  });

  it('should render select field with options', () => {
    const fieldsSelect: FieldConfig[] = [
      {
        name: 'country',
        label: 'Country',
        type: 'select',
        placeholder: 'Choose',
        options: [
          { label: 'Spain', value: 'es' },
          { label: 'France', value: 'fr' }
        ]
      }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsSelect;
    fixture.detectChanges();
    const select = fixture.debugElement.query(By.css('select'));
    expect(select).toBeTruthy();
    const options = fixture.debugElement.queryAll(By.css('select option'));
    expect(options.length).toBeGreaterThanOrEqual(2);
  });

  it('should show email error message when email validator fails', () => {
    const fieldsEmail: FieldConfig[] = [
      { name: 'email', label: 'Email', type: 'email', required: true, validators: [Validators.email], errorMessages: { email: 'Invalid email' } }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsEmail;
    fixture.detectChanges();
    component.form.get('email')?.setValue('notanemail');
    component.form.get('email')?.markAsTouched();
    component.form.get('email')?.updateValueAndValidity();
    const field: FieldConfig = { name: 'email', label: 'Email', type: 'email', required: true, errorMessages: { email: 'Invalid email' } };
    const msg = component.getErrorMessage(field);
    expect(msg).toBeTruthy();
    expect(msg).toContain('Invalid email');
  });

  it('should show minlength error message', () => {
    const fieldsMin: FieldConfig[] = [{ name: 'code', label: 'Code', type: 'text', required: true, validators: [Validators.minLength(3)] }];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsMin;
    fixture.detectChanges();
    component.form.get('code')?.setValue('ab');
    component.form.get('code')?.markAsTouched();
    component.form.get('code')?.updateValueAndValidity();
    const field: FieldConfig = { name: 'code', label: 'Code', type: 'text', required: true };
    const msg = component.getErrorMessage(field);
    expect(msg).toBeTruthy();
    expect(msg).toContain('al menos');
  });

  it('should show pattern error from errorMessages when provided', () => {
    const fieldsPattern: FieldConfig[] = [{ name: 'pin', label: 'PIN', type: 'text', validators: [Validators.pattern(/^\d{4}$/)], errorMessages: { pattern: 'Must be 4 digits' } }];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsPattern;
    fixture.detectChanges();
    component.form.get('pin')?.setValue('abc');
    component.form.get('pin')?.markAsTouched();
    component.form.get('pin')?.updateValueAndValidity();
    const field: FieldConfig = { name: 'pin', label: 'PIN', type: 'text', errorMessages: { pattern: 'Must be 4 digits' } };
    const msg = component.getErrorMessage(field);
    expect(msg).toBe('Must be 4 digits');
  });

  it('should render text input with icon when icon is set', () => {
    const fieldsIcon: FieldConfig[] = [{ name: 'search', label: 'Search', type: 'text', icon: 'search' }];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsIcon;
    fixture.detectChanges();
    const iconSpan = fixture.debugElement.query(By.css('.material-symbols-outlined'));
    expect(iconSpan?.nativeElement?.textContent?.trim()).toBe('search');
  });

  it('should show arrow_forward icon when submitLabel is not Crear Cuenta or Entrar', () => {
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = mockFields;
    component.submitLabel = 'Next step';
    fixture.detectChanges();
    const arrows = fixture.debugElement.queryAll(By.css('.material-symbols-outlined'));
    const hasArrow = arrows.some(el => el.nativeElement.textContent?.includes('arrow_forward'));
    expect(hasArrow).toBe(true);
  });

  it('should build checkbox with default false and requiredTrue', () => {
    const fieldsCb: FieldConfig[] = [{ name: 'agree', label: 'Agree', type: 'checkbox', required: true }];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsCb;
    fixture.detectChanges();
    expect(component.form.get('agree')?.value).toBe(false);
    component.form.get('agree')?.setValue(false);
    component.form.get('agree')?.markAsTouched();
    expect(component.form.get('agree')?.errors?.['required']).toBeTruthy();
  });

  it('should display field error in template when getErrorMessage returns string', () => {
    component.form.get('email')?.setValue('');
    component.form.get('email')?.markAsTouched();
    component.form.get('email')?.updateValueAndValidity();
    fixture.detectChanges();
    const errorP = fixture.debugElement.query(By.css('.text-red-500'));
    expect(errorP).toBeTruthy();
    expect(errorP.nativeElement.textContent).toContain('obligatorio');
  });

  it('should call preventDefault and stopPropagation on submit event', () => {
    const ev = new Event('submit', { cancelable: true });
    const preventSpy = vi.spyOn(ev, 'preventDefault');
    const stopSpy = vi.spyOn(ev, 'stopPropagation');
    component.form.patchValue({ email: 'a@a.com', password: 'Valid1!' });
    component.onSubmit(ev);
    expect(preventSpy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('should apply equalTo validator and show mustMatch error when values differ', () => {
    const fieldsWithConfirm: FieldConfig[] = [
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'confirm_password', label: 'Confirm', type: 'password', required: true, equalTo: 'password', errorMessages: { mustMatch: 'Las contraseñas no coinciden.' } }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsWithConfirm;
    fixture.detectChanges();
    component.form.get('password')?.setValue('Pass1!');
    component.form.get('confirm_password')?.setValue('Other1!');
    component.form.get('confirm_password')?.markAsTouched();
    component.form.get('confirm_password')?.updateValueAndValidity();
    const field: FieldConfig = { name: 'confirm_password', label: 'Confirm', type: 'password', equalTo: 'password', errorMessages: { mustMatch: 'Las contraseñas no coinciden.' } };
    const msg = component.getErrorMessage(field);
    expect(msg).toBe('Las contraseñas no coinciden.');
    expect(component.form.get('confirm_password')?.errors?.['mustMatch']).toBe(true);
  });

  it('should have no mustMatch error when equalTo field has same value', () => {
    const fieldsWithConfirm: FieldConfig[] = [
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'confirm_password', label: 'Confirm', type: 'password', required: true, equalTo: 'password' }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsWithConfirm;
    fixture.detectChanges();
    component.form.get('password')?.setValue('Pass1!');
    component.form.get('confirm_password')?.setValue('Pass1!');
    component.form.get('confirm_password')?.updateValueAndValidity();
    expect(component.form.get('confirm_password')?.errors?.['mustMatch']).toBeFalsy();
    const field: FieldConfig = { name: 'confirm_password', label: 'Confirm', type: 'password', equalTo: 'password' };
    expect(component.getErrorMessage(field)).toBeNull();
  });

  it('should re-validate confirm field when the equalTo control value changes', () => {
    const fieldsWithConfirm: FieldConfig[] = [
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'confirm_password', label: 'Confirm', type: 'password', required: true, equalTo: 'password' }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsWithConfirm;
    fixture.detectChanges();
    component.form.get('password')?.setValue('Pass1!');
    component.form.get('confirm_password')?.setValue('Pass1!');
    component.form.get('confirm_password')?.updateValueAndValidity();
    expect(component.form.get('confirm_password')?.valid).toBe(true);
    component.form.get('password')?.setValue('Other2!');
    expect(component.form.get('confirm_password')?.errors?.['mustMatch']).toBe(true);
  });

  it('should show default mustMatch message when errorMessages.mustMatch not provided', () => {
    const fieldsWithConfirm: FieldConfig[] = [
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'confirm_password', label: 'Confirm', type: 'password', equalTo: 'password' }
    ];
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.fields = fieldsWithConfirm;
    fixture.detectChanges();
    component.form.get('password')?.setValue('A');
    component.form.get('confirm_password')?.setValue('B');
    component.form.get('confirm_password')?.markAsTouched();
    component.form.get('confirm_password')?.updateValueAndValidity();
    const field: FieldConfig = { name: 'confirm_password', label: 'Confirm', type: 'password', equalTo: 'password' };
    const msg = component.getErrorMessage(field);
    expect(msg).toBe('Las contraseñas no coinciden.');
  });
});
