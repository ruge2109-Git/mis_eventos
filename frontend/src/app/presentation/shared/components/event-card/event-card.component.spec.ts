import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EventCardComponent } from './event-card.component';

describe('EventCardComponent', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: {
            availableLangs: ['es', 'en'],
            defaultLang: 'es',
          }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('event', { 
      id: 1,
      title: 'Test Event', 
      description: 'Test Description',
      startDate: new Date(),
      endDate: new Date(),
      location: 'Test Location',
      imageUrl: '',
      additionalImages: [],
      capacity: 100,
      registeredCount: 30,
      status: 'PUBLISHED',
      organizerId: 1,
      category: 'Test',
      isFeatured: false
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to event details', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.navigateToEvent();
    expect(navigateSpy).toHaveBeenCalledWith(['/evento', '1']);
  });

  it('should navigate on keydown Enter or Space', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');
    component.onCardKeydown(enterEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/evento', '1']);

    navigateSpy.mockClear();
    
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    component.onCardKeydown(spaceEvent);
    expect(navigateSpy).toHaveBeenCalledWith(['/evento', '1']);
    
    navigateSpy.mockClear();
    const otherEvent = new KeyboardEvent('keydown', { key: 'a' });
    component.onCardKeydown(otherEvent);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should return correct spots left', () => {
    expect(component.spotsLeft()).toBe(70); // 100 capacity - 30 registered
    
    fixture.componentRef.setInput('event', { ...component.event(), registeredCount: 150 });
    fixture.detectChanges();
    expect(component.spotsLeft()).toBe(0); // Cannot be negative
  });

  it('should return correct occupancy percent', () => {
    expect(component.occupancyPercent()).toBe(30); // 30 / 100
    
    fixture.componentRef.setInput('event', { ...component.event(), capacity: 0 });
    fixture.detectChanges();
    expect(component.occupancyPercent()).toBe(0); // Handles 0 capacity
    
    fixture.componentRef.setInput('event', { ...component.event(), capacity: 50, registeredCount: undefined });
    fixture.detectChanges();
    expect(component.occupancyPercent()).toBe(0); // Handles undefined registered
    
    fixture.componentRef.setInput('event', { ...component.event(), capacity: 10, registeredCount: 15 });
    fixture.detectChanges();
    expect(component.occupancyPercent()).toBe(100); // capped at 100
  });

  it('should return correct isFeaturedLayout', () => {
    expect(component.isFeaturedLayout()).toBe(false);
    
    fixture.componentRef.setInput('event', { ...component.event(), isFeatured: true });
    fixture.detectChanges();
    expect(component.isFeaturedLayout()).toBe(true);
    
    fixture.componentRef.setInput('event', { ...component.event(), isFeatured: false });
    fixture.componentRef.setInput('displayAsFeatured', true);
    fixture.detectChanges();
    expect(component.isFeaturedLayout()).toBe(true);
  });
});
