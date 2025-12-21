import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  template: `
    <button
      (click)="logout()"
      class="auth-button logout"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Log Out
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
      box-shadow: 0 0 0 3px rgba(252, 129, 129, 0.5);
    }

    .auth-button.logout {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .auth-button.logout:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(245, 87, 108, 0.4);
    }

    .auth-button.logout:active {
      transform: translateY(-1px);
    }
  `],
})
export class LogoutButtonComponent {
  private auth = inject(AuthService);

  logout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }
}

