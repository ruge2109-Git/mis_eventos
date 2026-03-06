export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  imageUrl: string;
  capacity: number;
  maxCapacity: number;
  isOpen: boolean;
  status: 'published' | 'draft' | 'cancelled';
  organizerId: string;
  category: string;
  isFeatured?: boolean;
}

export type CreateEventDTO = Omit<Event, 'id'>;
export type UpdateEventDTO = Partial<CreateEventDTO>;
