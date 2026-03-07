import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render overlay when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    const overlay = fixture.debugElement.query(By.css('.confirm-modal-overlay'));
    expect(overlay).toBeFalsy();
  });

  it('should render overlay with title and message when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Confirm action');
    fixture.componentRef.setInput('message', 'Are you sure?');
    fixture.componentRef.setInput('confirmLabel', 'Yes');
    fixture.componentRef.setInput('cancelLabel', 'No');
    fixture.detectChanges();
    const overlay = fixture.debugElement.query(By.css('.confirm-modal-overlay'));
    expect(overlay).toBeTruthy();
    expect(overlay.nativeElement.getAttribute('role')).toBe('dialog');
    expect(overlay.nativeElement.getAttribute('aria-modal')).toBe('true');
    const titleEl = fixture.debugElement.query(By.css('#confirm-modal-title'));
    expect(titleEl?.nativeElement.textContent?.trim()).toBe('Confirm action');
    const descEl = fixture.debugElement.query(By.css('#confirm-modal-desc'));
    expect(descEl?.nativeElement.textContent?.trim()).toBe('Are you sure?');
  });

  it('should emit confirm when confirm button is clicked (primary variant)', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('confirmVariant', 'primary');
    fixture.componentRef.setInput('confirmLabel', 'Yes');
    fixture.detectChanges();
    const confirmSpy = vi.spyOn(component.confirm, 'emit');
    const buttons = fixture.debugElement.queryAll(By.css('app-button'));
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    buttons[1].triggerEventHandler('clicked', null);
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should emit cancelRequested when cancel button is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('cancelLabel', 'Cancel');
    fixture.detectChanges();
    const cancelSpy = vi.spyOn(component.cancelRequested, 'emit');
    const cancelBtn = fixture.debugElement.query(By.css('app-button[variant="ghost"]'));
    expect(cancelBtn).toBeTruthy();
    cancelBtn.triggerEventHandler('clicked', null);
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should emit cancelRequested when overlay is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const cancelSpy = vi.spyOn(component.cancelRequested, 'emit');
    const overlay = fixture.debugElement.query(By.css('.confirm-modal-overlay'));
    overlay.nativeElement.dispatchEvent(new MouseEvent('click'));
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('onConfirm should emit confirm', () => {
    const spy = vi.spyOn(component.confirm, 'emit');
    component.onConfirm();
    expect(spy).toHaveBeenCalled();
  });

  it('onCancel should emit cancelRequested', () => {
    const spy = vi.spyOn(component.cancelRequested, 'emit');
    component.onCancel();
    expect(spy).toHaveBeenCalled();
  });

  it('onOverlayClick should emit cancelRequested', () => {
    const spy = vi.spyOn(component.cancelRequested, 'emit');
    component.onOverlayClick();
    expect(spy).toHaveBeenCalled();
  });

  it('should show danger confirm button when confirmVariant is danger', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('confirmVariant', 'danger');
    fixture.componentRef.setInput('confirmLabel', 'Delete');
    fixture.detectChanges();
    const dangerBtn = fixture.debugElement.query(By.css('button.bg-red-500'));
    expect(dangerBtn).toBeTruthy();
    expect(dangerBtn.nativeElement.textContent?.trim()).toContain('Delete');
  });

  it('should emit confirm when danger confirm button is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('confirmVariant', 'danger');
    fixture.componentRef.setInput('confirmLabel', 'Delete');
    fixture.detectChanges();
    const confirmSpy = vi.spyOn(component.confirm, 'emit');
    const dangerBtn = fixture.debugElement.query(By.css('button.bg-red-500'));
    dangerBtn.nativeElement.click();
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should have aria-labelledby and aria-describedby when open', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Title');
    fixture.componentRef.setInput('message', 'Message');
    fixture.detectChanges();
    const overlay = fixture.debugElement.query(By.css('.confirm-modal-overlay'));
    expect(overlay.nativeElement.getAttribute('aria-labelledby')).toBe('confirm-modal-title');
    expect(overlay.nativeElement.getAttribute('aria-describedby')).toBe('confirm-modal-desc');
  });
});
