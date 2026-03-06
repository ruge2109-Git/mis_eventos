import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '@core/application/services/toast.service';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render toast when service has no visible message', () => {
    expect(toastService.visible()).toBe(false);
    const wrapper = fixture.debugElement.query(By.css('.toast-wrapper'));
    expect(wrapper).toBeFalsy();
  });

  it('should render toast when service shows a message', () => {
    toastService.success('Success message');
    fixture.detectChanges();
    const wrapper = fixture.debugElement.query(By.css('.toast-wrapper'));
    expect(wrapper).toBeTruthy();
    const messageEl = fixture.debugElement.query(By.css('.message'));
    expect(messageEl?.nativeElement?.textContent?.trim()).toBe('Success message');
  });

  it('should set data-type success when type is success', () => {
    toastService.success('Ok');
    fixture.detectChanges();
    const toastEl = fixture.debugElement.query(By.css('.toast[data-type="success"]'));
    expect(toastEl).toBeTruthy();
  });

  it('should set data-type error when type is error', () => {
    toastService.error('Fail');
    fixture.detectChanges();
    const toastEl = fixture.debugElement.query(By.css('.toast[data-type="error"]'));
    expect(toastEl).toBeTruthy();
  });

  it('should set data-type info when type is info', () => {
    toastService.info('Note');
    fixture.detectChanges();
    const toastEl = fixture.debugElement.query(By.css('.toast[data-type="info"]'));
    expect(toastEl).toBeTruthy();
  });

  it('should show check_circle icon for success type', () => {
    toastService.success('Done');
    fixture.detectChanges();
    const icons = fixture.debugElement.queryAll(By.css('.material-symbols-outlined'));
    const hasCheckCircle = icons.some(el => el.nativeElement.textContent?.trim() === 'check_circle');
    expect(hasCheckCircle).toBe(true);
  });

  it('should show error icon for error type', () => {
    toastService.error('Error');
    fixture.detectChanges();
    const icons = fixture.debugElement.queryAll(By.css('.material-symbols-outlined'));
    const hasError = icons.some(el => el.nativeElement.textContent?.trim() === 'error');
    expect(hasError).toBe(true);
  });

  it('should show info icon for info type', () => {
    toastService.info('Info');
    fixture.detectChanges();
    const icons = fixture.debugElement.queryAll(By.css('.material-symbols-outlined'));
    const hasInfo = icons.some(el => el.nativeElement.textContent?.trim() === 'info');
    expect(hasInfo).toBe(true);
  });

  it('should call dismiss when toast div is clicked', () => {
    toastService.success('Click me');
    fixture.detectChanges();
    const toastEl = fixture.debugElement.query(By.css('.toast'));
    const dismissSpy = vi.spyOn(toastService, 'dismiss');
    toastEl.nativeElement.click();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should have close button with aria-label Cerrar', () => {
    toastService.success('Msg');
    fixture.detectChanges();
    const closeBtn = fixture.debugElement.query(By.css('button[aria-label="Cerrar"]'));
    expect(closeBtn).toBeTruthy();
  });

  it('should hide toast after dismiss is called', () => {
    toastService.success('Bye');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.toast-wrapper'))).toBeTruthy();
    toastService.dismiss();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.toast-wrapper'))).toBeFalsy();
  });
});
