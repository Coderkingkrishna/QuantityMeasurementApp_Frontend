import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthResponse, AuthService } from '../../services/auth.service';

interface AppConfig {
  googleClientId?: string;
}

interface GoogleCredentialResponse {
  credential: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
  email = '';
  password = '';
  authMessage = '';
  googleReady = false;

  private googleClientId = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.initializeGoogleAuth();
  }

  async googleLogin(): Promise<void> {
    if (!this.googleClientId) {
      this.authMessage = 'Google login is not configured yet.';
      return;
    }

    const googleApi = (window as any).google;
    if (!googleApi?.accounts?.id) {
      this.authMessage = 'Google Sign-In script is unavailable.';
      return;
    }

    googleApi.accounts.id.prompt();
  }

  async login(): Promise<void> {
    this.authMessage = '';

    if (!this.email.trim() || !this.password) {
      this.authMessage = 'Email and password are required.';
      return;
    }

    try {
      const response = await this.apiService.request<AuthResponse>('login', {
        method: 'POST',
        body: { email: this.email.trim(), password: this.password }
      });

      this.authService.saveAuth(response);
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.authMessage = error instanceof Error ? error.message : 'Login failed.';
    }
  }

  private async initializeGoogleAuth(): Promise<void> {
    try {
      const config = await fetch('data/app-config.json').then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load app-config.json');
        }

        return response.json() as Promise<AppConfig>;
      });

      this.googleClientId = config.googleClientId?.trim() || '';
      if (!this.googleClientId) {
        return;
      }

      await this.loadGoogleScript();
      const googleApi = (window as any).google;
      const googleButton = document.getElementById('googleLoginButton');

      if (!googleApi?.accounts?.id || !googleButton) {
        return;
      }

      googleApi.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (response: GoogleCredentialResponse) => {
          this.handleGoogleCredential(response).catch(() => {
            this.authMessage = 'Google login failed.';
          });
        }
      });

      googleApi.accounts.id.renderButton(googleButton, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 300
      });

      this.googleReady = true;
    } catch {
      // Leave standard login active if Google setup fails.
    }
  }

  private loadGoogleScript(): Promise<void> {
    if ((window as any).google?.accounts?.id) {
      return Promise.resolve();
    }

    const existing = document.getElementById('google-gsi-script') as HTMLScriptElement | null;
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google script.')), {
          once: true
        });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script.'));
      document.head.appendChild(script);
    });
  }

  private async handleGoogleCredential(response: GoogleCredentialResponse): Promise<void> {
    this.authMessage = '';

    if (!response?.credential) {
      this.authMessage = 'Google token was not returned.';
      return;
    }

    try {
      const authResponse = await this.apiService.request<AuthResponse>('google', {
        method: 'POST',
        body: { idToken: response.credential }
      });

      this.authService.saveAuth(authResponse);
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.authMessage = error instanceof Error ? error.message : 'Google login failed.';
    }
  }
}
