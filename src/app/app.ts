import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  protected showChangelog = signal(false);

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
