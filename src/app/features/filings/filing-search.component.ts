import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  standalone: true,
  imports: [FormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronUp,
      lucideSearch,
      lucideLoader2,
      lucideFile,
    }),
  ],
  template: `
    <div class="h-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] font-sans">
      <!-- Fixed Header -->
      <header class="flex-none border-b border-[#3c3c3c]">
        <!-- Title Bar -->
        <div class="flex items-center justify-between h-9 px-3 bg-[#252526]">
          <span class="text-[13px] text-[#cccccc]">SEC Filing Search</span>
          <button
            (click)="toggleQuery()"
            class="flex items-center gap-1 px-2 py-0.5 text-[12px] text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
          >
            {{ queryExpanded() ? 'Collapse' : 'Expand' }}
            <ng-icon
              [name]="queryExpanded() ? 'lucideChevronUp' : 'lucideChevronDown'"
              class="text-[14px]"
            />
          </button>
        </div>

        <!-- Query Panel -->
        @if (queryExpanded()) {
          <div class="bg-[#252526] border-t border-[#3c3c3c]">
            <div class="flex">
              <textarea
                [(ngModel)]="queryText"
                (keydown.enter)="onEnterKey($any($event))"
                placeholder="form_type = '8-K' order by snowflake desc limit 50"
                spellcheck="false"
                class="flex-1 h-20 px-3 py-2 bg-[#1e1e1e] text-[#d4d4d4] placeholder-[#6e6e6e] text-[13px] font-mono border-r border-[#3c3c3c] focus:outline-none resize-none"
              ></textarea>
              <button
                (click)="search()"
                [disabled]="loading()"
                class="w-24 flex items-center justify-center gap-1.5 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-[#6e6e6e] text-white text-[13px]"
              >
                @if (loading()) {
                  <ng-icon name="lucideLoader2" class="text-[16px] animate-spin" />
                } @else {
                  <ng-icon name="lucideSearch" class="text-[16px]" />
                }
                Search
              </button>
            </div>
            <div class="px-3 py-1 text-[11px] text-[#6e6e6e] border-t border-[#3c3c3c]">
              <kbd class="text-[#858585]">Ctrl+Enter</kbd> to search
            </div>
          </div>
        }
      </header>

      <!-- Results Area -->
      <main class="flex-1 overflow-auto">
        @if (error()) {
          <div class="px-3 py-2 bg-[#5a1d1d] text-[#f48771] text-[13px] border-b border-[#3c3c3c]">
            {{ error() }}
          </div>
        }

        @if (results().length === 0 && !loading() && !hasSearched()) {
          <div class="flex flex-col items-center justify-center h-full text-[#6e6e6e]">
            <ng-icon name="lucideSearch" class="text-[48px] mb-3 opacity-30" />
            <p class="text-[13px]">Enter a query to search SEC filings</p>
            <p class="text-[12px] mt-1 font-mono text-[#4e4e4e]">form_type = '10-K' limit 25</p>
          </div>
        }

        @if (results().length === 0 && !loading() && hasSearched()) {
          <div class="flex flex-col items-center justify-center h-full text-[#6e6e6e]">
            <p class="text-[13px]">No filings found</p>
          </div>
        }

        @if (results().length > 0) {
          <!-- Results Header -->
          <div
            class="sticky top-0 flex items-center h-6 px-3 bg-[#252526] border-b border-[#3c3c3c] text-[11px] text-[#858585] uppercase tracking-wide"
          >
            {{ results().length }} results
          </div>

          <!-- Results List -->
          <div class="divide-y divide-[#3c3c3c]">
            @for (filing of results(); track filing.id) {
              <div
                (click)="openDocument(filing)"
                class="group flex items-center hover:bg-[#2a2d2e] cursor-pointer"
              >
                <!-- Icon -->
                <div class="w-10 flex items-center justify-center text-[#858585]">
                  <ng-icon name="lucideFile" class="text-[16px]" />
                </div>

                <!-- Main Content -->
                <div class="flex-1 py-1.5 pr-2 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-[13px] text-[#d4d4d4] truncate">
                      {{ filing.companyConformedName }}
                    </span>
                    <span
                      class="flex-none px-1 py-0 text-[10px] font-medium bg-[#0e639c] text-white"
                    >
                      {{ filing.formType }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-[11px] text-[#858585] font-mono mt-0.5">
                    <span>{{ filing.accessionNumber }}</span>
                    <span>CIK {{ filing.centralIndexKey }}</span>
                    <span>{{ formatDate(filing.dateFiled) }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- Status Bar -->
      <footer class="flex-none h-6 flex items-center px-3 bg-[#007acc] text-white text-[12px]">
        @if (loading()) {
          <span>Searching...</span>
        } @else if (hasSearched()) {
          <span>{{ results().length }} filing(s)</span>
        } @else {
          <span>Ready</span>
        }
      </footer>
    </div>
  `,
})
export class FilingSearchComponent {
  private readonly filingService = inject(FilingService);
  private readonly router = inject(Router);

  queryText = "form_type = '8-K' order by snowflake desc limit 50";
  queryExpanded = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  results = signal<Filing[]>([]);
  hasSearched = signal(false);

  toggleQuery() {
    this.queryExpanded.update((v) => !v);
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      this.search();
    }
  }

  search() {
    if (!this.queryText.trim() || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    this.filingService.search(this.queryText).subscribe({
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
