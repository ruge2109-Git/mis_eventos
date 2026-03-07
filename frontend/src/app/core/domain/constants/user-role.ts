export const UserRole = {
  ADMIN: 'Admin',
  ORGANIZER: 'Organizer',
  ATTENDEE: 'Attendee'
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_OPTIONS_REGISTER: { label: string; value: UserRoleType; icon: string }[] = [
  { label: 'Asistente', value: UserRole.ATTENDEE, icon: 'person' },
  { label: 'Organizador', value: UserRole.ORGANIZER, icon: 'business_center' }
];

/** Roles que pueden acceder al dashboard de organizador. */
export function canAccessOrganizerDashboard(role: string | null): boolean {
  return role === UserRole.ORGANIZER || role === UserRole.ADMIN;
}

/** Solo administrador puede acceder al panel admin. */
export function canAccessAdminPanel(role: string | null): boolean {
  return role === UserRole.ADMIN;
}

/** Roles que ven el panel de asistente (Inicio, Mis Eventos, Calendario del asistente). */
export function canAccessAssistantDashboard(role: string | null): boolean {
  return role === UserRole.ATTENDEE;
}
