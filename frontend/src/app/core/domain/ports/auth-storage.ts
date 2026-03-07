export abstract class AuthStorage {
  abstract getToken(): string | null;
  abstract setToken(value: string): void;
  abstract removeToken(): void;

  abstract getUserId(): string | null;
  abstract setUserId(value: string): void;
  abstract removeUserId(): void;

  abstract getRole(): string | null;
  abstract setRole(value: string): void;
  abstract removeRole(): void;

  abstract getFullName(): string | null;
  abstract setFullName(value: string): void;
  abstract removeFullName(): void;

  clear(): void {
    this.removeToken();
    this.removeUserId();
    this.removeRole();
    this.removeFullName();
  }
}
