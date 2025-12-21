import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronUp,
  lucideSearch,
  lucideLoader2,
  lucideFile,
} from '@ng-icons/lucide';

import { FilingService } from '../../core/services/filing.service';
import { Filing } from '../../core/models/filing.model';

@Component({
  selector: 'app-filing-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronUp,
      lucideSearch,
      lucideLoader2,
      lucideFile,
    }),
  ],
  templateUrl: './filing-search.component.html',
})
export class FilingSearchComponent {
  private readonly filingService = inject(FilingService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  queryControl = new FormControl<string>(
    "form_type = '8-K' order by snowflake desc limit 50",
    { nonNullable: true }
  );
  queryExpanded = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  results = signal<Filing[]>([]);
  hasSearched = signal(false);

  toggleQuery() {
    this.queryExpanded.update((v) => !v);
  }

  search() {
    const queryText = this.queryControl.value.trim();
    if (!queryText || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    this.filingService
      .search(queryText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filings) => {
          this.results.set(filings ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Search failed:', err);
          this.error.set(err.message || 'Search failed. Please try again.');
          this.loading.set(false);
        },
      });
  }

  openDocument(filing: Filing) {
    this.router.navigate(['/document', filing.accessionNumber]);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
