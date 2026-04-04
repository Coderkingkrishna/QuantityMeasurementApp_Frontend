import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthResponse, AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';
  authMessage = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  async signup(): Promise<void> {
    this.authMessage = '';

    if (!this.name.trim() || !this.email.trim() || !this.password) {
      this.authMessage = 'Name, email, and password are required.';
      return;
    }

    try {
      const response = await this.apiService.request<AuthResponse>('signup', {
        method: 'POST',
        body: { name: this.name.trim(), email: this.email.trim(), password: this.password }
      });

      this.authService.saveAuth(response);
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.authMessage = error instanceof Error ? error.message : 'Signup failed.';
    }
  }
}
