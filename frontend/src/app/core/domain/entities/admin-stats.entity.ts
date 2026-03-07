export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  eventsByStatus: {
    DRAFT: number;
    PUBLISHED: number;
    CANCELLED: number;
  };
}
