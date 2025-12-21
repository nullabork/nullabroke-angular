import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideExternalLink,
  lucideFile,
  lucideFileText,
  lucideBuilding,
  lucideCalendar,
  lucideHash,
  lucideChevronRight,
  lucideChevronDown,
  lucideLoader2,
  lucidePanelLeftClose,
  lucidePanelLeft,
  lucideDownload,
  lucideGlobe,
} from '@ng-icons/lucide';

import { FilingService } from '../../core/services/filing.service';
import { Filing } from '../../core/models/filing.model';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [RouterLink, NgIcon],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideExternalLink,
      lucideFile,
      lucideFileText,
      lucideBuilding,
      lucideCalendar,
      lucideHash,
      lucideChevronRight,
      lucideChevronDown,
      lucideLoader2,
      lucidePanelLeftClose,
      lucidePanelLeft,
      lucideDownload,
      lucideGlobe,
    }),
  ],
  template: `
    <div class="h-screen flex flex-col bg-[#1e1e1e] text-[#cccccc]">
      <!-- Top Bar -->
      <header
        class="flex-none h-9 flex items-center justify-between px-2 bg-[#252526] border-b border-[#3c3c3c]"
      >
        <div class="flex items-center gap-2">
          <a
            routerLink="/"
            class="flex items-center justify-center w-7 h-7 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
            title="Back to search"
          >
            <ng-icon name="lucideArrowLeft" class="text-[16px]" />
          </a>
          <span class="text-[13px] text-[#858585]">|</span>
          @if (filing()) {
            <span class="text-[13px]">{{ filing()!.companyConformedName }}</span>
            <span class="px-1 py-0 text-[10px] font-medium bg-[#0e639c] text-white">
              {{ filing()!.formType }}
            </span>
          } @else {
            <span class="text-[13px] text-[#858585]">Loading...</span>
          }
        </div>
        <div class="flex items-center gap-1">
          <button
            (click)="toggleSidebar()"
            class="flex items-center justify-center w-7 h-7 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
            [title]="sidebarOpen() ? 'Hide sidebar' : 'Show sidebar'"
          >
            <ng-icon
              [name]="sidebarOpen() ? 'lucidePanelLeftClose' : 'lucidePanelLeft'"
              class="text-[16px]"
            />
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar -->
        @if (sidebarOpen()) {
          <aside
            class="w-72 flex-none flex flex-col bg-[#252526] border-r border-[#3c3c3c] overflow-hidden"
          >
            @if (loading()) {
              <div class="flex-1 flex items-center justify-center">
                <ng-icon name="lucideLoader2" class="text-[24px] text-[#858585] animate-spin" />
              </div>
            } @else if (filing()) {
              <div class="flex-1 overflow-y-auto">
                <!-- Filing Info Section -->
                <div class="border-b border-[#3c3c3c]">
                  <button
                    (click)="toggleSection('info')"
                    class="w-full flex items-center gap-1 px-3 py-2 text-[11px] uppercase tracking-wide text-[#cccccc] hover:bg-[#2a2d2e]"
                  >
                    <ng-icon
                      [name]="sections().info ? 'lucideChevronDown' : 'lucideChevronRight'"
                      class="text-[12px]"
                    />
                    Filing Info
                  </button>
                  @if (sections().info) {
                    <div class="px-3 pb-3 space-y-2">
                      <div class="flex items-start gap-2">
                        <ng-icon name="lucideFileText" class="text-[14px] text-[#858585] mt-0.5" />
                        <div>
                          <div class="text-[11px] text-[#858585]">Form Type</div>
                          <div class="text-[13px]">{{ filing()!.formType }}</div>
                        </div>
                      </div>
                      <div class="flex items-start gap-2">
                        <ng-icon name="lucideHash" class="text-[14px] text-[#858585] mt-0.5" />
                        <div>
                          <div class="text-[11px] text-[#858585]">Accession Number</div>
                          <div class="text-[12px] font-mono">{{ filing()!.accessionNumber }}</div>
                        </div>
                      </div>
                      <div class="flex items-start gap-2">
                        <ng-icon name="lucideCalendar" class="text-[14px] text-[#858585] mt-0.5" />
                        <div>
                          <div class="text-[11px] text-[#858585]">Filed Date</div>
                          <div class="text-[13px]">{{ formatDate(filing()!.dateFiled) }}</div>
                        </div>
                      </div>
                      @if (filing()!.size) {
                        <div class="flex items-start gap-2">
                          <ng-icon name="lucideFile" class="text-[14px] text-[#858585] mt-0.5" />
                          <div>
                            <div class="text-[11px] text-[#858585]">Size</div>
                            <div class="text-[13px]">{{ formatBytes(filing()!.size) }}</div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Company Section -->
                <div class="border-b border-[#3c3c3c]">
                  <button
                    (click)="toggleSection('company')"
                    class="w-full flex items-center gap-1 px-3 py-2 text-[11px] uppercase tracking-wide text-[#cccccc] hover:bg-[#2a2d2e]"
                  >
                    <ng-icon
                      [name]="sections().company ? 'lucideChevronDown' : 'lucideChevronRight'"
                      class="text-[12px]"
                    />
                    Company
                  </button>
                  @if (sections().company) {
                    <div class="px-3 pb-3 space-y-2">
                      <div class="flex items-start gap-2">
                        <ng-icon name="lucideBuilding" class="text-[14px] text-[#858585] mt-0.5" />
                        <div>
                          <div class="text-[11px] text-[#858585]">Name</div>
                          <div class="text-[13px]">{{ filing()!.companyConformedName }}</div>
                        </div>
                      </div>
                      <div class="flex items-start gap-2">
                        <ng-icon name="lucideHash" class="text-[14px] text-[#858585] mt-0.5" />
                        <div>
                          <div class="text-[11px] text-[#858585]">CIK</div>
                          <div class="text-[12px] font-mono">{{ filing()!.centralIndexKey }}</div>
                        </div>
                      </div>
                      @if (filing()!.ticker) {
                        <div>
                          <div class="text-[11px] text-[#858585]">Ticker</div>
                          <div class="text-[13px]">{{ filing()!.ticker }}</div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Tags Section -->
                @if (filing()!.tags && filing()!.tags.length > 0) {
                  <div class="border-b border-[#3c3c3c]">
                    <button
                      (click)="toggleSection('tags')"
                      class="w-full flex items-center gap-1 px-3 py-2 text-[11px] uppercase tracking-wide text-[#cccccc] hover:bg-[#2a2d2e]"
                    >
                      <ng-icon
                        [name]="sections().tags ? 'lucideChevronDown' : 'lucideChevronRight'"
                        class="text-[12px]"
                      />
                      Tags ({{ filing()!.tags.length }})
                    </button>
                    @if (sections().tags) {
                      <div class="px-3 pb-3 flex flex-wrap gap-1">
                        @for (tag of filing()!.tags; track tag) {
                          <span class="px-2 py-0.5 text-[11px] bg-[#3c3c3c] text-[#cccccc]">
                            {{ tag }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </aside>
        }

        <!-- Document Area -->
        <main class="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          @if (loading()) {
            <div class="flex-1 flex items-center justify-center">
              <ng-icon name="lucideLoader2" class="text-[32px] text-[#858585] animate-spin" />
            </div>
          } @else if (error()) {
            <div class="flex-1 flex flex-col items-center justify-center text-[#858585]">
              <p class="text-[15px]">Failed to load document</p>
              <p class="text-[13px] mt-1">{{ error() }}</p>
            </div>
          } @else if (filing()) {
            <div class="flex-1 flex flex-col items-center justify-center p-8">
              <!-- Document Preview Card -->
              <div class="w-full max-w-lg bg-[#252526] border border-[#3c3c3c]">
                <!-- Card Header -->
                <div class="px-6 py-4 border-b border-[#3c3c3c]">
                  <div class="flex items-center gap-3 mb-2">
                    <ng-icon name="lucideFileText" class="text-[24px] text-[#0e639c]" />
                    <div>
                      <h2 class="text-[15px] font-medium text-[#cccccc]">
                        {{ filing()!.formType }} Filing
                      </h2>
                      <p class="text-[12px] text-[#858585]">
                        {{ formatDate(filing()!.dateFiled) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Card Body -->
                <div class="px-6 py-4 space-y-3">
                  <div>
                    <div class="text-[11px] text-[#858585] uppercase tracking-wide mb-1">
                      Company
                    </div>
                    <div class="text-[14px] text-[#cccccc]">
                      {{ filing()!.companyConformedName }}
                    </div>
                  </div>
                  <div>
                    <div class="text-[11px] text-[#858585] uppercase tracking-wide mb-1">
                      Accession Number
                    </div>
                    <div class="text-[13px] font-mono text-[#cccccc]">
                      {{ filing()!.accessionNumber }}
                    </div>
                  </div>
                  @if (filing()!.description) {
                    <div>
                      <div class="text-[11px] text-[#858585] uppercase tracking-wide mb-1">
                        Description
                      </div>
                      <div class="text-[13px] text-[#cccccc]">{{ filing()!.description }}</div>
                    </div>
                  }
                </div>

                <!-- Card Actions -->
                <div class="px-6 py-4 border-t border-[#3c3c3c] space-y-2">
                  <a
                    [href]="getFilingViewerUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#0e639c] hover:bg-[#1177bb] text-white text-[13px] font-medium transition-colors"
                  >
                    <ng-icon name="lucideExternalLink" class="text-[16px]" />
                    Open Filing on SEC.gov
                  </a>
                  <a
                    [href]="getFilingIndexUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-[#cccccc] text-[13px] transition-colors"
                  >
                    <ng-icon name="lucideGlobe" class="text-[16px]" />
                    View Filing Index
                  </a>
                  <a
                    [href]="filing()!.absoluteFileUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-[#cccccc] text-[13px] transition-colors"
                  >
                    <ng-icon name="lucideDownload" class="text-[16px]" />
                    Download Raw Filing
                  </a>
                </div>
              </div>

              <!-- Help Text -->
              <p class="mt-6 text-[12px] text-[#6e6e6e] text-center max-w-md">
                SEC.gov restricts embedded viewing. Click "Open Filing" to view the document in a
                new tab.
              </p>
            </div>
          }
        </main>
      </div>

      <!-- Status Bar -->
      <footer
        class="flex-none h-6 flex items-center justify-between px-3 bg-[#007acc] text-white text-[12px]"
      >
        <div class="flex items-center gap-3">
          @if (filing()) {
            <span>{{ filing()!.accessionNumber }}</span>
          }
        </div>
        <div class="flex items-center gap-3">
          @if (filing()) {
            <span>{{ formatDate(filing()!.dateFiled) }}</span>
          }
        </div>
      </footer>
    </div>
  `,
})
export class DocumentViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly filingService = inject(FilingService);

  loading = signal(true);
  error = signal<string | null>(null);
  filing = signal<Filing | null>(null);
  sidebarOpen = signal(true);
  sections = signal({
    info: true,
    company: true,
    tags: false,
  });

  ngOnInit() {
    const accessionNumber = this.route.snapshot.paramMap.get('accessionNumber');
    if (accessionNumber) {
      this.loadFiling(accessionNumber);
    } else {
      this.error.set('No accession number provided');
      this.loading.set(false);
    }
  }

  loadFiling(accessionNumber: string) {
    const query = `accession_number = '${accessionNumber}' limit 1`;
    this.filingService.search(query).subscribe({
      next: (filings) => {
        if (filings && filings.length > 0) {
          this.filing.set(filings[0]);
        } else {
          this.error.set('Filing not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load filing:', err);
        this.error.set(err.message || 'Failed to load filing');
        this.loading.set(false);
      },
    });
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  toggleSection(section: 'info' | 'company' | 'tags') {
    this.sections.update((s) => ({
      ...s,
      [section]: !s[section],
    }));
  }

  getFilingViewerUrl(): string {
    const f = this.filing();
    if (!f) return '';
    // SEC filing viewer URL format
    const accessionNoDashes = f.accessionNumber.replace(/-/g, '');
    return `https://www.sec.gov/Archives/edgar/data/${f.centralIndexKey}/${accessionNoDashes}/${f.accessionNumber}-index.htm`;
  }

  getFilingIndexUrl(): string {
    const f = this.filing();
    if (!f) return '';
    const accessionNoDashes = f.accessionNumber.replace(/-/g, '');
    return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${f.centralIndexKey}&type=${f.formType}&dateb=&owner=include&count=40&search_text=`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
