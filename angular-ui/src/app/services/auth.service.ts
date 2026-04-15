import { Injectable } from '@angular/core';

export interface AuthResponse {
  token: string;
  name?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  saveAuth(authResponse: AuthResponse): void {
    if (!authResponse?.token) {
      throw new Error('Token not found in response.');
    }

    localStorage.setItem('qm_token', authResponse.token);
    localStorage.setItem('qm_user_name', authResponse.name || '');
    localStorage.setItem('qm_user_email', authResponse.email || '');
  }

  clearAuth(): void {
    localStorage.removeItem('qm_token');
    localStorage.removeItem('qm_user_name');
    localStorage.removeItem('qm_user_email');
  }

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem('qm_token'));
  }

  getUserName(): string {
    return localStorage.getItem('qm_user_name') || '';
  }

  getToken(): string {
    return localStorage.getItem('qm_token') || '';
  }
}
