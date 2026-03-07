import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    // @ts-expect-error test double: event is a signal, we assign a getter
    component.event = () => ({ 
      id: 1,
      title: 'Test Event', 
      description: 'Test Description',
      startDate: new Date(),
      endDate: new Date(),
      location: 'Test Location',
      imageUrl: '',
      additionalImages: [],
      capacity: 100,
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
});
