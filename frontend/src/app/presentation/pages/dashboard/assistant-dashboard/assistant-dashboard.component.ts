import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthStore } from '@core/application/store/auth.store';
import { GetMyRegisteredEventsUseCase } from '@core/application/usecases/get-my-registered-events.usecase';
import { GetEventsUseCase } from '@core/application/usecases/get-events.usecase';
import { Event } from '@core/domain/entities/event.entity';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-assistant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, ButtonComponent],
  templateUrl: './assistant-dashboard.component.html',
  styleUrl: './assistant-dashboard.component.scss'
})
export class AssistantDashboardComponent implements OnInit {
  private authStore = inject(AuthStore);
  private getMyRegisteredEvents = inject(GetMyRegisteredEventsUseCase);
  private getEventsUseCase = inject(GetEventsUseCase);

  myEvents = signal<Event[]>([]);
  recommendations = signal<Event[]>([]);
  loading = signal(true);
  loadingRecommendations = signal(true);

  displayName = computed(() => {
    const name = this.authStore.fullName();
    return (name && name.trim()) || 'Usuario';
  });

  nextEvent = computed(() => {
    const events = this.myEvents();
    const now = new Date();
    const upcoming = events
      .filter(e => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return upcoming[0] ?? null;
  });

  /** Próximos eventos (futuros, ordenados por fecha) para la lista de la derecha */
  upcomingList = computed(() => {
    const events = this.myEvents();
    const now = new Date();
    return events
      .filter(e => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  });

  totalRegistered = computed(() => this.myEvents().length);

  ngOnInit(): void {
    this.loadMyEventsFirst();
  }

  /** Solo una llamada inicial: eventos en los que estoy registrado. Luego recomendaciones. */
  private loadMyEventsFirst(): void {
    this.loading.set(true);
    this.getMyRegisteredEvents.execute().pipe(catchError(() => of([]))).subscribe(evs => {
      this.myEvents.set(evs);
      this.loading.set(false);
      this.loadRecommendations();
    });
  }

  private loadRecommendations(): void {
    this.loadingRecommendations.set(true);
    const registeredIds = new Set(this.myEvents().map(e => e.id));
    this.getEventsUseCase.execute(0, 6).pipe(catchError(() => of({ items: [] as Event[], total: 0 }))).subscribe(res => {
      this.recommendations.set(res.items.filter(e => !registeredIds.has(e.id) && e.status === 'PUBLISHED'));
      this.loadingRecommendations.set(false);
    });
  }
}
