import { Injectable } from '@angular/core';
import { AuthStorage } from '@core/domain/ports/auth-storage';

const KEY_TOKEN = 'access_token';
const KEY_USER_ID = 'user_id';
const KEY_ROLE = 'user_role';
const KEY_FULL_NAME = 'full_name';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageAuthStorage extends AuthStorage {
  
  getToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_TOKEN) : null;
  }
  
  setToken(value: string): void {
    localStorage.setItem(KEY_TOKEN, value);
  }

  removeToken(): void {
    localStorage.removeItem(KEY_TOKEN);
  }

  getUserId(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_USER_ID) : null;
  }
  
  setUserId(value: string): void {
    localStorage.setItem(KEY_USER_ID, value);
  }
  
  removeUserId(): void {
    localStorage.removeItem(KEY_USER_ID);
  }

  getRole(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_ROLE) : null;
  }
  
  setRole(value: string): void {
    localStorage.setItem(KEY_ROLE, value);
  }

  removeRole(): void {
    localStorage.removeItem(KEY_ROLE);
  }

  getFullName(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_FULL_NAME) : null;
  }

  setFullName(value: string): void {
    localStorage.setItem(KEY_FULL_NAME, value);
  }

  removeFullName(): void {
    localStorage.removeItem(KEY_FULL_NAME);
  }
}
