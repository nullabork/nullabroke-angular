import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed } from '@angular/core';
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
  lucideSave,
  lucidePlus,
  lucideCopy,
} from '@ng-icons/lucide';
import { BrnResizableGroup, BrnResizablePanel, BrnResizableHandle } from '@spartan-ng/brain/resizable';
import { DatePipe } from '@angular/common';

import { FilingService } from '../../core/services/filing.service';
import { SavedQueriesService } from '../../core/services/saved-queries.service';
import { Filing } from '../../core/models/filing.model';

@Component({
  selector: 'app-filing-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, 
    NgIcon, 
    DatePipe,
    BrnResizableGroup,
    BrnResizablePanel,
    BrnResizableHandle
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronUp,
      lucideSearch,
      lucideLoader2,
      lucideFile,
      lucideSave,
      lucidePlus,
      lucideCopy,
    }),
  ],
  templateUrl: './filing-search.component.html',
})
export class FilingSearchComponent {
  private readonly filingService = inject(FilingService);
  private readonly savedQueriesService = inject(SavedQueriesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  queryControl = new FormControl<string>(
    '',
    { nonNullable: true }
  );
  
  queryExpanded = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  results = signal<Filing[]>([]);
  hasSearched = signal(false);

  // Sidebar state
  private readonly SKINNY_THRESHOLD_PERCENT = 10;
  isSidebarSkinny = signal(false);
  
  // Expose saved queries service state as computed signals to avoid repeated keyvalue pipe calls
  savedQueries = this.savedQueriesService.savedQueries;
  savedQueriesEntries = computed(() => Object.entries(this.savedQueries()));
  hasSavedQueries = computed(() => this.savedQueriesEntries().length > 0);
  currentGuid = this.savedQueriesService.currentGuid;
  isDirty = this.savedQueriesService.isDirty;

  constructor() {
    // Initialize query control from service state or use default
    const currentQuery = this.savedQueriesService.currentQuery();
    if (currentQuery) {
      this.queryControl.setValue(currentQuery);
    } else {
      this.queryControl.setValue("form_type = '8-K' order by snowflake desc limit 50");
      this.savedQueriesService.setQueryText(this.queryControl.value);
    }

    // Sync control changes → service (sidebar selection syncs via selectSavedQuery method)
    this.queryControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(val => {
        this.savedQueriesService.setQueryText(val);
      });
  }

  toggleQuery() {
    this.queryExpanded.update((v) => !v);
  }

  onLayoutChange(sizes: number[]) {
    this.isSidebarSkinny.set(sizes[0] < this.SKINNY_THRESHOLD_PERCENT);
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

  // Saved Queries Actions
  newQuery() {
    this.savedQueriesService.newQuery();
    this.queryControl.setValue('');
  }

  duplicateQuery() {
    this.savedQueriesService.duplicate();
  }

  saveQuery() {
    this.savedQueriesService.save();
  }

  selectSavedQuery(guid: string) {
    this.savedQueriesService.selectQuery(guid);
    this.queryControl.setValue(this.savedQueriesService.currentQuery());
  }

  // Visual Helpers
  getColorForGuid(guid: string): string {
    // Simple hash to hex color
    let hash = 0;
    for (let i = 0; i < guid.length; i++) {
      hash = guid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  getTextForSquare(query: string): string {
    // Regex to find value after equals in quotes
    // e.g. thing="10-k" -> 10k
    const match = query.match(/=\s*['"]([^'"]+)['"]/);
    if (match && match[1]) {
      // Remove non-alphanumeric
      const text = match[1].replace(/[^a-zA-Z0-9]/g, '');
      return text.substring(0, 4);
    }
    return '??';
  }
}
