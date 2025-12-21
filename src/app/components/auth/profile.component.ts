import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (auth.isLoading$ | async) {
      <div class="profile-loading">
        <div class="loading-spinner"></div>
        <span>Loading profile...</span>
      </div>
    }

    @if ((auth.isAuthenticated$ | async) && (auth.user$ | async); as user) {
      <div class="profile-container">
        @if (user.picture) {
          <div class="avatar-wrapper">
            <img
              [src]="user.picture"
              [alt]="user.name || 'User'"
              class="avatar"
            />
            <div class="avatar-ring"></div>
          </div>
        }
        <div class="profile-info">
          <h2 class="profile-name">{{ user.name }}</h2>
          <p class="profile-email">{{ user.email }}</p>
          @if (user.email_verified) {
            <span class="verified-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Verified
            </span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .profile-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: #a0aec0;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(102, 126, 234, 0.2);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .profile-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .avatar-wrapper {
      position: relative;
    }

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid transparent;
      background: linear-gradient(#1a1e27, #1a1e27) padding-box,
                  linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
      transition: transform 0.3s ease;
    }

    .avatar:hover {
      transform: scale(1.05);
    }

    .avatar-ring {
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      border: 2px dashed rgba(102, 126, 234, 0.3);
      animation: rotate 20s linear infinite;
    }

    @keyframes rotate {
      to { transform: rotate(360deg); }
    }

    .profile-info {
      text-align: center;
    }

    .profile-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: #f7fafc;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .profile-email {
      font-size: 1rem;
      color: #a0aec0;
      margin: 0 0 0.75rem 0;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #68d391;
      background: rgba(104, 211, 145, 0.1);
      border: 1px solid rgba(104, 211, 145, 0.2);
      border-radius: 20px;
    }
  `],
})
export class ProfileComponent {
  protected auth = inject(AuthService);
}

