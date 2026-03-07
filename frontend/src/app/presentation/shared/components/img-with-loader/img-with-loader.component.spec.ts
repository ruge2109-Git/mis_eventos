import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImgWithLoaderComponent } from './img-with-loader.component';

describe('ImgWithLoaderComponent', () => {
  let component: ImgWithLoaderComponent;
  let fixture: ComponentFixture<ImgWithLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImgWithLoaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ImgWithLoaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('src', 'https://example.com/img.jpg');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show loader when not loaded and no error', () => {
    fixture.componentRef.setInput('src', 'https://example.com/img.jpg');
    fixture.detectChanges();
    expect(component.loaded()).toBe(false);
    expect(component.error()).toBe(false);
    const loader = fixture.nativeElement.querySelector('.animate-spin');
    expect(loader).toBeTruthy();
  });

  it('should set loaded and clear error on load', () => {
    fixture.componentRef.setInput('src', 'https://example.com/img.jpg');
    fixture.detectChanges();
    component.onLoad();
    expect(component.loaded()).toBe(true);
    expect(component.error()).toBe(false);
  });

  it('should set error on image error', () => {
    fixture.componentRef.setInput('src', 'https://example.com/bad.jpg');
    fixture.detectChanges();
    component.onError();
    expect(component.loaded()).toBe(true);
    expect(component.error()).toBe(true);
  });

  it('should reset loaded and error when src changes', () => {
    fixture.componentRef.setInput('src', 'https://example.com/a.jpg');
    fixture.detectChanges();
    component.onLoad();
    expect(component.loaded()).toBe(true);
    fixture.componentRef.setInput('src', 'https://example.com/b.jpg');
    fixture.detectChanges();
    expect(component.loaded()).toBe(false);
    expect(component.error()).toBe(false);
  });

  it('should render img with correct src and alt', () => {
    fixture.componentRef.setInput('src', 'https://example.com/photo.jpg');
    fixture.componentRef.setInput('alt', 'Photo description');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
    expect(img.getAttribute('alt')).toBe('Photo description');
  });

  it('should apply object-contain when objectFit is contain', () => {
    fixture.componentRef.setInput('src', 'https://example.com/img.jpg');
    fixture.componentRef.setInput('objectFit', 'contain');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.classList.contains('object-contain')).toBe(true);
    expect(img.classList.contains('object-cover')).toBe(false);
  });

  it('should apply object-cover by default', () => {
    fixture.componentRef.setInput('src', 'https://example.com/img.jpg');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.classList.contains('object-cover')).toBe(true);
  });

  it('should show error state in template when error is true', () => {
    fixture.componentRef.setInput('src', 'https://example.com/img.jpg');
    fixture.detectChanges();
    component.onError();
    fixture.detectChanges();
    expect(component.error()).toBe(true);
    const spans = fixture.nativeElement.querySelectorAll('span.material-symbols-outlined');
    const errorSpan = (Array.from(spans) as HTMLElement[]).find((s) => s.textContent?.trim() === 'broken_image');
    expect(errorSpan).toBeTruthy();
  });
});
