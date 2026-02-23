import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, filter, take } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Redirect authenticated users to /filings (handles Auth0 callback landing on /)
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

  ngOnInit() {
    this.title.setTitle('Nullabroke - Search SEC Filings Like a Pro');
    this.meta.updateTag({ name: 'description', content: 'Search, explore, and analyze SEC filings with powerful query-driven workflows. Built for analysts, researchers, and anyone who needs fast access to EDGAR data.' });
  }
}
