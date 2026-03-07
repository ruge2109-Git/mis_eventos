export interface Event {
  id: number;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  imageUrl: string | null;
  additionalImages: string[];
  capacity: number;
  status: 'PUBLISHED' | 'DRAFT' | 'CANCELLED';
  organizerId: number;
  category?: string;
  isFeatured?: boolean;
  warning?: string;
  registeredCount?: number;
}

export type CreateEventDTO = Omit<Event, 'id' | 'status' | 'organizerId'>;
export type UpdateEventDTO = Partial<CreateEventDTO>;
