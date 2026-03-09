import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTransloco } from '@jsverse/transloco';
import { ImagePreviewModalComponent } from './image-preview-modal.component';

describe('ImagePreviewModalComponent', () => {
  let component: ImagePreviewModalComponent;
  let fixture: ComponentFixture<ImagePreviewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagePreviewModalComponent],
      providers: [
        provideTransloco({
          config: {
            availableLangs: ['es'],
            defaultLang: 'es',
          }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImagePreviewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render modal if imageUrl is null', () => {
    fixture.componentRef.setInput('imageUrl', null);
    fixture.detectChanges();
    const modalDiv = fixture.debugElement.query(By.css('.fixed.inset-0'));
    expect(modalDiv).toBeNull();
  });

  it('should render modal if imageUrl is provided', () => {
    fixture.componentRef.setInput('imageUrl', 'http://example.com/image.png');
    fixture.detectChanges();
    const modalDiv = fixture.debugElement.query(By.css('.fixed.inset-0'));
    expect(modalDiv).toBeTruthy();
    
    const imgWithLoader = fixture.debugElement.query(By.css('app-img-with-loader'));
    expect(imgWithLoader).toBeTruthy();
    expect(imgWithLoader.componentInstance.src()).toBe('http://example.com/image.png');
  });

  it('should emit closeModal when backdrop is clicked', () => {
    fixture.componentRef.setInput('imageUrl', 'http://example.com/image.png');
    fixture.detectChanges();
    
    const emitSpy = vi.spyOn(component.closeModal, 'emit');
    const backdrop = fixture.debugElement.query(By.css('.fixed.inset-0'));
    
    backdrop.triggerEventHandler('click', new MouseEvent('click'));
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should emit closeModal when backdrop receives escape keydown', () => {
    fixture.componentRef.setInput('imageUrl', 'http://example.com/image.png');
    fixture.detectChanges();
    
    const emitSpy = vi.spyOn(component.closeModal, 'emit');
    const backdrop = fixture.debugElement.query(By.css('.fixed.inset-0'));
    
    backdrop.triggerEventHandler('keydown.escape', new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should stop propagation when inner container is clicked', () => {
    fixture.componentRef.setInput('imageUrl', 'http://example.com/image.png');
    fixture.detectChanges();
    
    const innerContainer = fixture.debugElement.query(By.css('.relative.max-w-\\[90vw\\]'));
    const stopPropagationSpy = vi.fn();
    const mockEvent: any = { stopPropagation: stopPropagationSpy };
    
    innerContainer.triggerEventHandler('click', mockEvent);
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should stop propagation when inner container receives escape keydown', () => {
    fixture.componentRef.setInput('imageUrl', 'http://example.com/image.png');
    fixture.detectChanges();
    
    const innerContainer = fixture.debugElement.query(By.css('.relative.max-w-\\[90vw\\]'));
    const stopPropagationSpy = vi.fn();
    const mockEvent: any = { stopPropagation: stopPropagationSpy };
    
    innerContainer.triggerEventHandler('keydown.escape', mockEvent);
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should emit closeModal when close button is clicked', () => {
    fixture.componentRef.setInput('imageUrl', 'http://example.com/image.png');
    fixture.detectChanges();
    
    const emitSpy = vi.spyOn(component.closeModal, 'emit');
    const closeBtn = fixture.debugElement.query(By.css('app-button'));
    
    closeBtn.triggerEventHandler('clicked', new MouseEvent('click'));
    expect(emitSpy).toHaveBeenCalled();
  });
});
