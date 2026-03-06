import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show label when label input is set', () => {
    fixture.componentRef.setInput('label', 'Email');
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('label'));
    expect(label).toBeTruthy();
    expect(label.nativeElement.textContent.trim()).toBe('Email');
  });

  it('should not show label when label is null', () => {
    fixture.componentRef.setInput('label', null);
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('label'));
    expect(label).toBeFalsy();
  });

  it('should bind formControl to input', () => {
    const control = new FormControl('test value');
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.value).toBe('test value');
  });

  it('should show validation message when control is invalid and touched', () => {
    const control = new FormControl('', { validators: () => ({ required: true }) });
    control.markAsTouched();
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
    const errorSpan = fixture.debugElement.query(By.css('.text-red-500'));
    expect(errorSpan?.nativeElement?.textContent).toContain('Campo inválido');
  });

  it('should render icon when icon input is set', () => {
    fixture.componentRef.setInput('icon', 'mail');
    fixture.detectChanges();
    const iconSpan = fixture.debugElement.query(By.css('.material-symbols-outlined'));
    expect(iconSpan).toBeTruthy();
    expect(iconSpan.nativeElement.textContent.trim()).toBe('mail');
  });

  it('should set placeholder on input', () => {
    fixture.componentRef.setInput('placeholder', 'Enter email');
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.placeholder).toBe('Enter email');
  });
});
