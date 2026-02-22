import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from './core/services/user.service';
import { WelcomeModalComponent } from './components/welcome-modal/welcome-modal.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, WelcomeModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('nullabroke');
  protected readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected showChangelog = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(map(() => this.router.url)),
    { initialValue: this.router.url }
  );

  /** Show app chrome (status bar, welcome modal) only on app pages, not on home or auth */
  protected showAppChrome = computed(() => {
    const url = this.url();
    return url !== '/' && !url.startsWith('/auth');
  });

  logout(): void {
    this.auth.logout({
      logoutParams: { returnTo: window.location.origin },
    });
  }

  openChangelog(): void {
    this.showChangelog.set(true);
  }

  onChangelogClosed(): void {
    this.showChangelog.set(false);
  }
}
