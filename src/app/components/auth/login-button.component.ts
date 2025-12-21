import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-login-button',
  standalone: true,
  template: `
    <button
      (click)="loginWithRedirect()"
      class="auth-button login"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      Log In
    </button>
  `,
  styles: [`
    .auth-button {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      font-family: inherit;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .auth-button:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.5);
    }

    .auth-button.login {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .auth-button.login:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .auth-button.login:active {
      transform: translateY(-1px);
    }
  `],
})
export class LoginButtonComponent {
  private auth = inject(AuthService);

  loginWithRedirect(): void {
    this.auth.loginWithRedirect();
  }
}

