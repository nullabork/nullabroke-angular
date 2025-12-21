import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
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
          <div class="loading-card">
            <div class="loading-spinner"></div>
            <p class="loading-text">Authenticating...</p>
          </div>
        }

        <!-- Error State -->
        @if (auth.error$ | async; as error) {
          <div class="error-card">
            <div class="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 class="error-title">Authentication Error</h2>
            <p class="error-message">{{ error.message }}</p>
            <app-login-button />
          </div>
        }

        <!-- Main Content -->
        @if (!(auth.isLoading$ | async) && !(auth.error$ | async)) {
          <div class="main-card">
            <!-- Logo -->
            <div class="logo-section">
              <img
                src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png"
                alt="Auth0"
                class="auth0-logo"
              />
            </div>

            <h1 class="title">
              @if (auth.isAuthenticated$ | async) {
                Welcome Back!
              } @else {
                Welcome to Looko2
              }
            </h1>

            <!-- Authenticated State -->
            @if (auth.isAuthenticated$ | async) {
              <div class="authenticated-section">
                <div class="success-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Successfully authenticated</span>
                </div>

                <div class="profile-section">
                  <h2 class="section-title">Your Profile</h2>
                  <app-profile />
                </div>

                <div class="actions">
                  <app-logout-button />
                  <a href="/" class="secondary-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Go to App
                  </a>
                </div>
              </div>
            } @else {
              <!-- Unauthenticated State -->
              <div class="unauthenticated-section">
                <p class="description">
                  Sign in to access your SEC filings and documents securely.
                </p>

                <div class="features">
                  <div class="feature">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Secure Authentication</span>
                  </div>
                  <div class="feature">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>Access SEC Filings</span>
                  </div>
                  <div class="feature">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Real-time Updates</span>
                  </div>
                </div>

                <app-login-button />

                <p class="terms">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            }
          </div>
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
      background: #0a0b0e;
    }

    .background-effects {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.4;
      animation: float 20s infinite ease-in-out;
    }

    .orb-1 {
      width: 600px;
      height: 600px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      top: -200px;
      left: -200px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      bottom: -150px;
      right: -150px;
      animation-delay: -7s;
    }

    .orb-3 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -14s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(50px, 50px) scale(1.1); }
      50% { transform: translate(-30px, 80px) scale(0.95); }
      75% { transform: translate(40px, -40px) scale(1.05); }
    }

    .orb-3 {
      @keyframes float {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        25% { transform: translate(-45%, -55%) scale(1.1); }
        50% { transform: translate(-55%, -45%) scale(0.95); }
        75% { transform: translate(-48%, -52%) scale(1.05); }
      }
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 50px 50px;
    }

    .auth-container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 480px;
      padding: 2rem;
    }

    .loading-card,
    .error-card,
    .main-card {
      background: rgba(26, 30, 39, 0.85);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      padding: 3rem 2.5rem;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .loading-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(102, 126, 234, 0.2);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 1.2rem;
      color: #a0aec0;
      margin: 0;
    }

    .error-card {
      text-align: center;
    }

    .error-icon {
      color: #f56565;
      margin-bottom: 1rem;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f7fafc;
      margin: 0 0 0.5rem 0;
    }

    .error-message {
      color: #a0aec0;
      margin: 0 0 2rem 0;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .auth0-logo {
      width: 140px;
      opacity: 0.9;
      transition: opacity 0.3s ease;
    }

    .auth0-logo:hover {
      opacity: 1;
    }

    .title {
      font-size: 2.25rem;
      font-weight: 800;
      text-align: center;
      color: #f7fafc;
      margin: 0 0 2rem 0;
      letter-spacing: -0.02em;
    }

    .authenticated-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .success-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: rgba(104, 211, 145, 0.15);
      border: 1px solid rgba(104, 211, 145, 0.3);
      border-radius: 30px;
      color: #68d391;
      font-weight: 600;
      font-size: 0.95rem;
      animation: pulse 2s infinite ease-in-out;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(104, 211, 145, 0.2); }
      50% { box-shadow: 0 0 0 10px rgba(104, 211, 145, 0); }
    }

    .profile-section {
      width: 100%;
      text-align: center;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #a0aec0;
      margin: 0 0 1rem 0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }

    .secondary-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      color: #a0aec0;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .secondary-button:hover {
      color: #f7fafc;
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.05);
    }

    .unauthenticated-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .description {
      font-size: 1.1rem;
      color: #a0aec0;
      text-align: center;
      margin: 0;
      line-height: 1.6;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      color: #cbd5e0;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .feature:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(102, 126, 234, 0.3);
      transform: translateX(5px);
    }

    .feature svg {
      color: #667eea;
      flex-shrink: 0;
    }

    .terms {
      font-size: 0.8rem;
      color: #718096;
      text-align: center;
      margin: 0;
    }

    @media (max-width: 480px) {
      .auth-container {
        padding: 1rem;
      }

      .loading-card,
      .error-card,
      .main-card {
        padding: 2rem 1.5rem;
        border-radius: 20px;
      }

      .title {
        font-size: 1.75rem;
      }

      .auth0-logo {
        width: 120px;
      }
    }
  `],
})
export class AuthComponent {
  protected auth = inject(AuthService);
}

