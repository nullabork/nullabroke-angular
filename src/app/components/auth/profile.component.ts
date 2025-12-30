import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (auth.isLoading$ | async) {
      <div class="loading">Loading...</div>
    }

    @if ((auth.isAuthenticated$ | async) && (auth.user$ | async); as user) {
      <div class="profile">
        <div class="name">{{ user.name }}</div>
        <div class="email">{{ user.email }}</div>
      </div>
    }
  `,
  styles: [`
    .loading {
      font-size: 0.8rem;
      color: #808080;
    }

    .profile {
      text-align: center;
      padding: 0.5rem 0;
    }

    .name {
      font-size: 0.9rem;
      font-weight: 500;
      color: #cccccc;
    }

    .email {
      font-size: 0.75rem;
      color: #808080;
      margin-top: 0.25rem;
    }
  `],
})
export class ProfileComponent {
  protected auth = inject(AuthService);
}
