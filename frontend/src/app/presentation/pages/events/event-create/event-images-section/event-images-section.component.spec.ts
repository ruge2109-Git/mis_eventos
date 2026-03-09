import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventImagesSectionComponent } from './event-images-section.component';
import { provideTransloco } from '@jsverse/transloco';
import { ComponentRef } from '@angular/core';

describe('EventImagesSectionComponent', () => {
  let component: EventImagesSectionComponent;
  let fixture: ComponentFixture<EventImagesSectionComponent>;
  let componentRef: ComponentRef<EventImagesSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventImagesSectionComponent],
      providers: [provideTransloco({ config: { availableLangs: ['es', 'en'], defaultLang: 'es' } })]
    }).compileComponents();

    fixture = TestBed.createComponent(EventImagesSectionComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit coverChange on onCoverChange', () => {
    const spy = vi.spyOn(component.coverChange, 'emit');
    const mockEvent = new Event('change');
    component.onCoverChange(mockEvent);
    expect(spy).toHaveBeenCalledWith(mockEvent);
  });

  it('should emit additionalFilesAdd with valid files on onAdditionalInputChange', () => {
    const spy = vi.spyOn(component.additionalFilesAdd, 'emit');
    const input = document.createElement('input');
    const validFile = new File([''], 'test.png', { type: 'image/png' });
    const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [validFile, invalidFile] });
    const mockEvent = { target: input } as unknown as Event;

    component.onAdditionalInputChange(mockEvent);
    expect(spy).toHaveBeenCalledWith([validFile]);
    expect(input.value).toBe('');
  });

  it('should not emit additionalFilesAdd if no files', () => {
    const spy = vi.spyOn(component.additionalFilesAdd, 'emit');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: null });
    const mockEvent = { target: input } as unknown as Event;

    component.onAdditionalInputChange(mockEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit dragOverChange to true on onDragover', () => {
    const spy = vi.spyOn(component.dragOverChange, 'emit');
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as DragEvent;
    
    component.onDragover(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should emit dragOverChange to false on onDragleave', () => {
    const spy = vi.spyOn(component.dragOverChange, 'emit');
    component.onDragleave();
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('should emit additionalDrop with valid files and prevent default', () => {
    const dropSpy = vi.spyOn(component.additionalDrop, 'emit');
    const dragSpy = vi.spyOn(component.dragOverChange, 'emit');
    const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [validFile] }
    } as unknown as DragEvent;

    component.onDrop(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(dragSpy).toHaveBeenCalledWith(false);
    expect(dropSpy).toHaveBeenCalledWith([validFile]);
  });

  it('should not emit additionalDrop if no valid files in drop', () => {
    const dropSpy = vi.spyOn(component.additionalDrop, 'emit');
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: null
    } as unknown as DragEvent;

    component.onDrop(mockEvent);
    expect(dropSpy).not.toHaveBeenCalled();
  });

  it('should map displayItems from inputs correctly', () => {
    componentRef.setInput('savedUrls', ['url1']);
    componentRef.setInput('newPreviewUrls', ['url2', 'url3']);
    fixture.detectChanges();

    const items = component.displayItems();
    expect(items.length).toBe(3);
    expect(items[0]).toEqual({ url: 'url1', isNew: false, index: 0 });
    expect(items[1]).toEqual({ url: 'url2', isNew: true, index: 0 });
    expect(items[2]).toEqual({ url: 'url3', isNew: true, index: 1 });
  });

  it('onRemoveItem should emit removeNewAt when isNew is true', () => {
    const spyNew = vi.spyOn(component.removeNewAt, 'emit');
    const mockEvent = new MouseEvent('click');
    const stopSpy = vi.spyOn(mockEvent, 'stopPropagation');
    component.onRemoveItem(mockEvent, { url: 'u', isNew: true, index: 1 });
    expect(stopSpy).toHaveBeenCalled();
    expect(spyNew).toHaveBeenCalledWith(1);
  });

  it('onRemoveItem should emit removeSavedAt when isNew is false', () => {
    const spySaved = vi.spyOn(component.removeSavedAt, 'emit');
    const mockEvent = new MouseEvent('click');
    component.onRemoveItem(mockEvent, { url: 'u', isNew: false, index: 0 });
    expect(spySaved).toHaveBeenCalledWith(0);
  });

  it('onItemPreviewClick should emit previewClick', () => {
    const spy = vi.spyOn(component.previewClick, 'emit');
    component.onItemPreviewClick('preview.jpg');
    expect(spy).toHaveBeenCalledWith('preview.jpg');
  });
});
