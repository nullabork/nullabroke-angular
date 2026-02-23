import { Component, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, filter, take } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { LoginButtonComponent } from '../../components/auth/login-button.component';
import { LogoutButtonComponent } from '../../components/auth/logout-button.component';
import { ProfileComponent } from '../../components/auth/profile.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, LoginButtonComponent, LogoutButtonComponent, ProfileComponent],
  template: `
    <div class="auth-page">
      <!-- Animated background -->
      <div class="background-effects">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
        <div class="grid-overlay"></div>
      </div>

      <div class="auth-container">
        <!-- Loading State -->
        @if (auth.isLoading$ | async) {
          <div class="card">
            <div class="loading-spinner"></div>
            <p class="loading-text">Authenticating...</p>
          </div>
        }

        <!-- Error State -->
        @if (auth.error$ | async; as error) {
          <div class="card error-card">
            <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h2 class="error-title">Authentication Error</h2>
            <p class="error-message">{{ error.message }}</p>
            <app-login-button />
          </div>
        }

        <!-- Main Content -->
        @if (!(auth.isLoading$ | async) && !(auth.error$ | async)) {
          @if (auth.isAuthenticated$ | async) {
            <!-- Authenticated State -->
            <div class="card">
              <div class="success-indicator">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Authenticated
              </div>
              
              <app-profile />
              
              <div class="button-group">
                <a href="/filings" class="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="13 17 18 12 13 7"/>
                    <polyline points="6 17 11 12 6 7"/>
                  </svg>
                  Continue to App
                </a>
                <app-logout-button />
              </div>
            </div>
          } @else {
            <!-- Unauthenticated State -->
            <div class="card">
              <div class="logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              
              <h1 class="title">Nullabroke</h1>
              <p class="subtitle">SEC Filing Viewer</p>
              
              <app-login-button />
              
              <p class="hint">Sign in to continue</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
      background: #1e1e1e;
      padding-bottom: 28px;
    }

    /* Animated Background */
    .background-effects {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.25;
      animation: float 25s infinite ease-in-out;
    }

    .orb-1 {
      width: 600px;
      height: 600px;
      background: #0e639c;
      top: -250px;
      left: -200px;
    }

    .orb-2 {
      width: 500px;
      height: 500px;
      background: #646695;
      bottom: -200px;
      right: -150px;
      animation-delay: -10s;
    }

    .orb-3 {
      width: 350px;
      height: 350px;
      background: #4ec9b0;
      top: 60%;
      left: 20%;
      animation-delay: -18s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(40px, -40px) scale(1.05); }
      66% { transform: translate(-30px, 50px) scale(0.95); }
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    /* Card */
    .auth-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 340px;
      padding: 1rem;
    }

    .card {
      background: #252526;
      border: 1px solid #3c3c3c;
      border-radius: 6px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Logo */
    .logo {
      color: #0e639c;
      margin-bottom: 0.25rem;
    }

    /* Typography */
    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #cccccc;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .subtitle {
      font-size: 0.85rem;
      color: #808080;
      margin: 0;
      margin-top: -0.5rem;
    }

    .hint {
      font-size: 0.75rem;
      color: #6e6e6e;
      margin: 0;
      margin-top: 0.5rem;
    }

    /* Loading */
    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 2px solid #3c3c3c;
      border-top-color: #0e639c;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 0.85rem;
      color: #808080;
      margin: 0;
    }

    /* Error */
    .error-card {
      border-color: #5a1d1d;
    }

    .error-icon {
      color: #f14c4c;
    }

    .error-title {
      font-size: 1rem;
      font-weight: 600;
      color: #cccccc;
      margin: 0;
    }

    .error-message {
      font-size: 0.8rem;
      color: #808080;
      margin: 0;
      text-align: center;
      word-break: break-word;
    }

    /* Success */
    .success-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #4ec9b0;
      padding: 0.35rem 0.75rem;
      background: rgba(78, 201, 176, 0.1);
      border-radius: 3px;
    }

    /* Buttons */
    .button-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      margin-top: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 3px;
      text-decoration: none;
      transition: background 0.15s ease;
      cursor: pointer;
      border: none;
      font-family: inherit;
    }

    .btn-primary {
      background: #0e639c;
      color: #ffffff;
      width: 100%;
    }

    .btn-primary:hover {
      background: #1177bb;
    }

    @media (max-width: 400px) {
      .auth-container {
        padding: 0.75rem;
      }

      .card {
        padding: 1.5rem;
      }
    }
  `],
})
export class AuthComponent {
  protected auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Auto-redirect authenticated users to /filings
    combineLatest([this.auth.isLoading$, this.auth.isAuthenticated$]).pipe(
      filter(([isLoading]) => !isLoading),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([, isAuthenticated]) => {
      if (isAuthenticated) {
        this.router.navigate(['/filings']);
      }
    });
  }
}
