export interface Session {
  id: number;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  speaker: string;
  eventId: number;
}

export interface CreateSessionDTO {
  title: string;
  startTime: Date;
  endTime: Date;
  speaker: string;
  eventId: number;
  description?: string | null;
}

export interface UpdateSessionDTO {
  title: string;
  startTime: Date;
  endTime: Date;
  speaker: string;
  description?: string | null;
}
