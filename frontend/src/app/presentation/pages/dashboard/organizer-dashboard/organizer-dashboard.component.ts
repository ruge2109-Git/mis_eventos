import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent } from '@shared/components/button/button.component';
import { EventStore } from '@core/application/store/event.store';
import { GetOrganizerEventsUseCase } from '@core/application/usecases/get-organizer-events.usecase';
import { EventRepository } from '@core/domain/ports/event.repository';
import { Event } from '@core/domain/entities/event.entity';
import { ToastService } from '@core/application/services/toast.service';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TranslocoModule,
    ButtonComponent
  ],
  templateUrl: './organizer-dashboard.component.html',
  styleUrl: './organizer-dashboard.component.scss'
})
export class OrganizerDashboardComponent implements OnInit {
  store = inject(EventStore);
  private getOrganizerEventsUseCase = inject(GetOrganizerEventsUseCase);
  private eventRepository = inject(EventRepository);
  private toast = inject(ToastService);

  actionLoadingId = signal<number | null>(null);

  private now = new Date();
  private startOfMonth = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
  private endOfMonth = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0, 23, 59, 59);

  totalEvents = computed(() => this.store.events().length);

  upcomingThisMonth = computed(() =>
    this.store.events().filter(
      e => e.status !== 'CANCELLED' && e.startDate >= this.startOfMonth && e.startDate <= this.endOfMonth
    ).length
  );

  attendanceRate = computed(() => {
    const total = this.store.events().length;
    if (total === 0) return 0;
    return Math.min(92, 70 + Math.floor(total * 2));
  });

  upcomingEvents = computed(() => {
    const events = this.store.events().filter(
      e => e.status !== 'CANCELLED' && new Date(e.startDate) >= this.now
    );
    return [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 6);
  });

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents(append = false) {
    const { skip, limit } = this.store.pagination();
    const nextSkip = append ? skip + limit : 0;
    if (append) this.store.setPagination(nextSkip, limit);
    this.getOrganizerEventsUseCase.execute(nextSkip, limit, undefined, append).subscribe();
  }

  publishEvent(event: Event) {
    this.actionLoadingId.set(event.id);
    this.eventRepository.publish(event.id).subscribe({
      next: (updated) => {
        this.store.updateEvent(updated);
        this.toast.success('Evento publicado');
        this.actionLoadingId.set(null);
      },
      error: (err) => {
        this.toast.error(err?.error?.detail ?? err?.message ?? 'Error al publicar');
        this.actionLoadingId.set(null);
      }
    });
  }

  cancelEvent(event: Event) {
    this.actionLoadingId.set(event.id);
    this.eventRepository.cancel(event.id).subscribe({
      next: (updated) => {
        this.store.updateEvent(updated);
        this.toast.success('Evento cancelado');
        this.actionLoadingId.set(null);
      },
      error: (err) => {
        this.toast.error(err?.error?.detail ?? err?.message ?? 'Error al cancelar');
        this.actionLoadingId.set(null);
      }
    });
  }

  onFileSelected(ev: Event, fileInput: HTMLInputElement) {
    const file = fileInput.files?.[0];
    if (!file) return;
    this.actionLoadingId.set(ev.id);
    this.eventRepository.uploadImage(ev.id, file).subscribe({
      next: (updated) => {
        this.store.updateEvent(updated);
        this.toast.success('Imagen actualizada');
        this.actionLoadingId.set(null);
        fileInput.value = '';
      },
      error: (err) => {
        this.toast.error(err?.error?.detail ?? err?.message ?? 'Error al subir imagen');
        this.actionLoadingId.set(null);
        fileInput.value = '';
      }
    });
  }

  isActionLoading(id: number): boolean {
    return this.actionLoadingId() === id;
  }
}
