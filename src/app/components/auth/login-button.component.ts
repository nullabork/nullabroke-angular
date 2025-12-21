import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-login-button',
  standalone: true,
  template: `
    <button (click)="loginWithRedirect()" class="btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      Sign in
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      border-radius: 3px;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
      background: #0e639c;
      color: #ffffff;
      width: 100%;
    }

    .btn:hover {
      background: #1177bb;
    }

    .btn:focus {
      outline: 1px solid #007fd4;
      outline-offset: 2px;
    }
  `],
})
export class LoginButtonComponent {
  private auth = inject(AuthService);

  loginWithRedirect(): void {
    this.auth.loginWithRedirect();
  }
}
