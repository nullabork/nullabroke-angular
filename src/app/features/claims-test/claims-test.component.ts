import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-claims-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Claims Test</h2>
      
      <div class="info-box">
        <p><strong>API URL:</strong> {{ apiUrl }}</p>
        <p><strong>User:</strong> {{ (auth.user$ | async)?.name || 'Not logged in' }}</p>
      </div>

      <div class="actions">
        <button (click)="testClaims()" [disabled]="loading()">
          Test /authentication/test
        </button>
        <button (click)="testClaimsV1()" [disabled]="loading()">
          Test /api/v1/authentication/test
        </button>
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      }

      @if (error()) {
        <div class="error">
          <h3>Error</h3>
          <pre>{{ error() }}</pre>
        </div>
      }

      @if (result()) {
        <div class="success">
          <h3>Result</h3>
          <pre>{{ result() }}</pre>
        </div>
      }

      <div class="token-debug">
        <button (click)="showToken()" class="secondary">Log Token to Console</button>
      </div>
      
      <div class="footer">
        <a href="/" class="back-link">← Back</a>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; max-width: 800px; margin: 0 auto; color: #ccc; }
    .info-box { background: #333; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
    .actions { display: flex; gap: 10px; margin-bottom: 20px; }
    button { padding: 10px 20px; cursor: pointer; background: #0078d4; color: white; border: none; border-radius: 4px; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.secondary { background: #444; }
    .loading { color: #888; font-style: italic; }
    .error { background: #5a1d1d; padding: 10px; border-radius: 4px; margin-top: 20px; }
    .success { background: #1b4d2e; padding: 10px; border-radius: 4px; margin-top: 20px; }
    pre { white-space: pre-wrap; word-break: break-all; margin: 0; }
    .token-debug { margin-top: 40px; border-top: 1px solid #444; padding-top: 20px; }
    .back-link { color: #0078d4; text-decoration: none; }
    .back-link:hover { text-decoration: underline; }
  `]
})
export class ClaimsTestComponent {
  http = inject(HttpClient);
  auth = inject(AuthService);
  
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<string | null>(null);
  
  // Try to determine the likely URL based on environment
  apiUrl = environment.apiBaseUrl;

  testClaims() {
    this.runTest(`${this.apiUrl}/authentication/test`);
  }

  testClaimsV1() {
    // Fallback if the proxy doesn't rewrite, we might need the full path
    // Or if the apiUrl is just the root domain
    this.runTest(`${this.apiUrl}/authentication/test`);
  }

  private runTest(url: string) {
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (data) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set(`Status: ${err.status}\nText: ${err.statusText}\nMessage: ${err.message}\nURL: ${url}`);
        this.loading.set(false);
      }
    });
  }

  showToken() {
    this.auth.getAccessTokenSilently().subscribe({
      next: (token) => console.log('Token:', token),
      error: (err) => console.error('Token Error:', err)
    });
  }
}


