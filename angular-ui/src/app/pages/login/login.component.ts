import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthResponse, AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  authMessage = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

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
}
