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

  clear(): void {
    this.removeToken();
    this.removeUserId();
    this.removeRole();
  }
}
