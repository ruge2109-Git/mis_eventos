import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit clicked when button is clicked', () => {
    let emitted: MouseEvent | undefined;
    component.clicked.subscribe((e: MouseEvent) => (emitted = e));
    const btn = fixture.debugElement.query(By.css('button'));
    btn.nativeElement.click();
    expect(emitted).toBeDefined();
  });

  it('should be disabled when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.disabled).toBe(true);
  });

  it('should be disabled when loading input is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.disabled).toBe(true);
  });

  it('should show loading spinner when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.animate-spin'));
    expect(spinner).toBeTruthy();
  });

  it('should apply variant primary by default', () => {
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.className).toContain('bg-accent-cyan');
  });

  it('should apply customClass when provided', () => {
    fixture.componentRef.setInput('customClass', 'my-custom-class');
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.className).toContain('my-custom-class');
  });

  it('should have type button by default', () => {
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.type).toBe('button');
  });
});
