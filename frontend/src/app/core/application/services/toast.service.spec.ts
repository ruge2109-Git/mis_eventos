import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { vi } from 'vitest';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have visible false and message null initially', () => {
    expect(service.visible()).toBe(false);
    expect(service.message()).toBeNull();
  });

  it('should set message, type and visible when show is called', () => {
    service.show('Test message', 'success');
    expect(service.message()).toBe('Test message');
    expect(service.type()).toBe('success');
    expect(service.visible()).toBe(true);
  });

  it('should default to info type when show is called without type', () => {
    service.show('Info text');
    expect(service.type()).toBe('info');
  });

  it('should call show with success type when success() is called', () => {
    service.success('Done!');
    expect(service.message()).toBe('Done!');
    expect(service.type()).toBe('success');
    expect(service.visible()).toBe(true);
  });

  it('should call show with error type when error() is called', () => {
    service.error('Something failed');
    expect(service.message()).toBe('Something failed');
    expect(service.type()).toBe('error');
    expect(service.visible()).toBe(true);
  });

  it('should call show with info type when info() is called', () => {
    service.info('FYI');
    expect(service.message()).toBe('FYI');
    expect(service.type()).toBe('info');
    expect(service.visible()).toBe(true);
  });

  it('should set visible to false when dismiss is called', () => {
    service.show('Hi');
    expect(service.visible()).toBe(true);
    service.dismiss();
    expect(service.visible()).toBe(false);
  });

  it('should auto-dismiss after autoHideMs when show is called', () => {
    service.show('Auto hide');
    expect(service.visible()).toBe(true);
    vi.advanceTimersByTime(4000);
    expect(service.visible()).toBe(false);
  });

  it('should clear previous timeout when show is called again before auto-hide', () => {
    service.show('First');
    vi.advanceTimersByTime(2000);
    service.show('Second');
    vi.advanceTimersByTime(2000);
    expect(service.message()).toBe('Second');
    expect(service.visible()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(service.visible()).toBe(false);
  });

  it('should clear timeout when dismiss is called', () => {
    service.show('Test');
    service.dismiss();
    vi.advanceTimersByTime(5000);
    expect(service.visible()).toBe(false);
  });
});
