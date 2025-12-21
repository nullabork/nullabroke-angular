import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideExternalLink,
  lucideFile,
  lucideFileText,
  lucideChevronRight,
  lucideChevronDown,
  lucideLoader2,
  lucidePanelLeftClose,
  lucidePanelLeft,
  lucideFileCode,
  lucideTable,
  lucideAlertCircle,
  lucideRefreshCw,
  lucideImage,
} from '@ng-icons/lucide';

import { FilingService } from '../../core/services/filing.service';
import { DocumentService } from '../../core/services/document.service';
import { Filing } from '../../core/models/filing.model';
import { DocumentFile, DocumentMeta } from '../../core/models/document.model';

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
      lucideChevronRight,
      lucideChevronDown,
      lucideLoader2,
      lucidePanelLeftClose,
      lucidePanelLeft,
      lucideFileCode,
      lucideTable,
      lucideAlertCircle,
      lucideRefreshCw,
      lucideImage,
    }),
  ],
  template: `
    <div class="h-screen flex flex-col bg-[#1e1e1e] text-[#cccccc]">
      <!-- Top Bar -->
      <header class="flex-none h-9 flex items-center justify-between px-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div class="flex items-center gap-2">
          <a
            routerLink="/"
            class="flex items-center justify-center w-7 h-7 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
            title="Back to search"
          >
            <ng-icon name="lucideArrowLeft" class="text-[16px]" />
          </a>
          <span class="text-[13px] text-[#3c3c3c]">|</span>
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
            <ng-icon [name]="sidebarOpen() ? 'lucidePanelLeftClose' : 'lucidePanelLeft'" class="text-[16px]" />
          </button>
          @if (filing()) {
            <a
              [href]="filing()!.absoluteFileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center w-7 h-7 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]"
              title="Open raw filing on SEC.gov"
            >
              <ng-icon name="lucideExternalLink" class="text-[16px]" />
            </a>
          }
        </div>
      </header>

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar -->
        @if (sidebarOpen()) {
          <aside class="w-64 flex-none flex flex-col bg-[#252526] border-r border-[#3c3c3c] overflow-hidden">
            @if (loading()) {
              <div class="flex-1 flex items-center justify-center">
                <ng-icon name="lucideLoader2" class="text-[24px] text-[#858585] animate-spin" />
              </div>
            } @else if (filing()) {
              <div class="flex-1 overflow-y-auto">
                <!-- Filing Info -->
                <div class="border-b border-[#3c3c3c]">
                  <button
                    (click)="toggleSection('info')"
                    class="w-full flex items-center gap-1 px-3 py-2 text-[11px] uppercase tracking-wide text-[#cccccc] hover:bg-[#2a2d2e]"
                  >
                    <ng-icon [name]="sections().info ? 'lucideChevronDown' : 'lucideChevronRight'" class="text-[12px]" />
                    Filing
                  </button>
                  @if (sections().info) {
                    <div class="px-3 pb-2 text-[12px] space-y-1">
                      <div class="text-[#858585]">{{ filing()!.formType }} · {{ formatDate(filing()!.dateFiled) }}</div>
                      <div class="font-mono text-[11px] text-[#6e6e6e]">{{ filing()!.accessionNumber }}</div>
                    </div>
                  }
                </div>

                <!-- Documents List -->
                <div>
                  <button
                    (click)="toggleSection('documents')"
                    class="w-full flex items-center gap-1 px-3 py-2 text-[11px] uppercase tracking-wide text-[#cccccc] hover:bg-[#2a2d2e]"
                  >
                    <ng-icon [name]="sections().documents ? 'lucideChevronDown' : 'lucideChevronRight'" class="text-[12px]" />
                    Documents ({{ documents().length }})
                  </button>
                  @if (sections().documents) {
                    <div class="pb-2">
                      @for (doc of documents(); track doc.sequence) {
                        <button
                          (click)="selectDocument(doc)"
                          class="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#2a2d2e]"
                          [class.bg-[#094771]]="selectedDocument()?.sequence === doc.sequence"
                        >
                          <ng-icon [name]="getDocIcon(doc)" class="text-[14px] text-[#858585] flex-none" />
                          <div class="flex-1 min-w-0">
                            <div class="text-[12px] truncate" [class.text-white]="selectedDocument()?.sequence === doc.sequence">
                              {{ doc.filename }}
                            </div>
                            @if (doc.description) {
                              <div class="text-[10px] text-[#6e6e6e] truncate">{{ doc.description }}</div>
                            }
                          </div>
                          @if (doc.sequence === 1) {
                            <span class="text-[9px] px-1 bg-[#0e639c] text-white flex-none">PRIMARY</span>
                          }
                        </button>
                      }
                    </div>
                  }
                </div>

                <!-- Company -->
                <div class="border-t border-[#3c3c3c]">
                  <button
                    (click)="toggleSection('company')"
                    class="w-full flex items-center gap-1 px-3 py-2 text-[11px] uppercase tracking-wide text-[#cccccc] hover:bg-[#2a2d2e]"
                  >
                    <ng-icon [name]="sections().company ? 'lucideChevronDown' : 'lucideChevronRight'" class="text-[12px]" />
                    Company
                  </button>
                  @if (sections().company) {
                    <div class="px-3 pb-2 text-[12px]">
                      <div class="text-[#cccccc]">{{ filing()!.companyConformedName }}</div>
                      <div class="text-[#6e6e6e] font-mono text-[11px]">CIK {{ filing()!.centralIndexKey }}</div>
                    </div>
                  }
                </div>
              </div>
            }
          </aside>
        }

        <!-- Document Viewer -->
        <main class="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          @if (loading()) {
            <div class="flex-1 flex items-center justify-center">
              <ng-icon name="lucideLoader2" class="text-[32px] text-[#858585] animate-spin" />
            </div>
          } @else if (error()) {
            <div class="flex-1 flex flex-col items-center justify-center text-[#858585]">
              <ng-icon name="lucideAlertCircle" class="text-[48px] text-red-500 mb-3" />
              <p class="text-[15px]">Failed to load filing</p>
              <p class="text-[13px] mt-1 text-[#6e6e6e]">{{ error() }}</p>
            </div>
          } @else if (documentLoading()) {
            <div class="flex-1 flex items-center justify-center">
              <ng-icon name="lucideLoader2" class="text-[32px] text-[#858585] animate-spin" />
            </div>
          } @else if (documentError()) {
            <!-- API Error - Show fallback options -->
            <div class="flex-1 flex flex-col items-center justify-center p-8">
              <div class="w-full max-w-lg bg-[#252526] border border-[#3c3c3c]">
                <div class="flex items-center gap-3 px-5 py-4 border-b border-[#3c3c3c]">
                  <ng-icon name="lucideAlertCircle" class="text-[28px] text-amber-500" />
                  <div>
                    <h2 class="text-[14px] font-medium text-[#cccccc]">Failed to Load Document</h2>
                    <p class="text-[12px] text-[#858585]">{{ selectedDocument()?.filename }}</p>
                  </div>
                </div>

                <div class="px-5 py-4 space-y-3 text-[13px]">
                  <div class="text-[11px] font-mono text-[#6e6e6e] bg-[#1e1e1e] p-2 rounded overflow-x-auto max-h-24 overflow-y-auto">
                    {{ documentError() }}
                  </div>
                </div>

                <div class="px-5 py-4 border-t border-[#3c3c3c] space-y-2">
                  <button
                    (click)="retryLoadDocument()"
                    class="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-[#cccccc] text-[13px] transition-colors"
                  >
                    <ng-icon name="lucideRefreshCw" class="text-[16px]" />
                    Retry
                  </button>
                  @if (selectedDocument() && filing()) {
                    <a
                      [href]="getSecGovUrl()"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#0e639c] hover:bg-[#1177bb] text-white text-[13px] font-medium transition-colors"
                    >
                      <ng-icon name="lucideExternalLink" class="text-[16px]" />
                      Open on SEC.gov
                    </a>
                  }
                </div>
              </div>
            </div>
          } @else if (documentHtml()) {
            <!-- Render HTML document -->
            <div class="flex-1 overflow-auto bg-white">
              <div class="document-content" [innerHTML]="documentHtml()"></div>
            </div>
          } @else if (selectedDocument()) {
            <!-- Placeholder when no content yet -->
            <div class="flex-1 flex flex-col items-center justify-center text-[#6e6e6e]">
              <ng-icon name="lucideLoader2" class="text-[48px] mb-3 animate-spin" />
              <p class="text-[13px]">Loading document...</p>
            </div>
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center text-[#6e6e6e]">
              <ng-icon name="lucideFile" class="text-[48px] mb-3 opacity-30" />
              <p class="text-[13px]">Select a document from the sidebar</p>
            </div>
          }
        </main>
      </div>

      <!-- Status Bar -->
      <footer class="flex-none h-6 flex items-center justify-between px-3 bg-[#007acc] text-white text-[12px]">
        <div class="flex items-center gap-3">
          @if (selectedDocument()) {
            <span>{{ selectedDocument()!.filename }}</span>
            @if (documentError()) {
              <span class="text-amber-300">· Error</span>
            }
          } @else if (filing()) {
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
  styles: [
    `
      .document-content {
        padding: 20px;
        font-family: serif;
        color: #000;
        line-height: 1.6;
      }
      .document-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
      }
      .document-content td, .document-content th {
        border: 1px solid #ccc;
        padding: 8px;
      }
      .document-content img {
        max-width: 100%;
      }
    `,
  ],
})
export class DocumentViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly filingService = inject(FilingService);
  private readonly documentService = inject(DocumentService);

  loading = signal(true);
  error = signal<string | null>(null);
  filing = signal<Filing | null>(null);
  documentMeta = signal<DocumentMeta | null>(null);
  documents = signal<DocumentFile[]>([]);
  selectedDocument = signal<DocumentFile | null>(null);
  sidebarOpen = signal(true);

  documentLoading = signal(false);
  documentError = signal<string | null>(null);
  documentHtml = signal<SafeHtml | null>(null);

  sections = signal({
    info: true,
    documents: true,
    company: false,
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
    // Load filing info and document metadata in parallel
    const query = `accession_number = '${accessionNumber}' limit 1`;

    this.filingService.search(query).subscribe({
      next: (filings) => {
        if (filings && filings.length > 0) {
          this.filing.set(filings[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load filing:', err);
      },
    });

    // Load document metadata to get actual document list
    this.documentService.getDocumentMeta(accessionNumber).subscribe({
      next: (meta) => {
        this.documentMeta.set(meta);
        if (meta.documents && meta.documents.length > 0) {
          // Filter to show only viewable documents (HTM, HTML, TXT, XML)
          const viewableDocs = meta.documents.filter((doc) => {
            const filename = (doc.filename || '').toLowerCase();
            return (
              filename.endsWith('.htm') ||
              filename.endsWith('.html') ||
              filename.endsWith('.txt') ||
              filename.endsWith('.xml')
            );
          });
          this.documents.set(viewableDocs);

          // Auto-select the first document
          if (viewableDocs.length > 0) {
            this.selectDocument(viewableDocs[0]);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load document meta:', err);
        this.error.set(err.message || 'Failed to load document metadata');
        this.loading.set(false);
      },
    });
  }

  selectDocument(doc: DocumentFile) {
    this.selectedDocument.set(doc);
    this.loadDocumentContent(doc);
  }

  loadDocumentContent(doc: DocumentFile) {
    const filing = this.filing();
    const accessionNumber = this.route.snapshot.paramMap.get('accessionNumber');
    if (!accessionNumber) return;

    this.documentLoading.set(true);
    this.documentError.set(null);
    this.documentHtml.set(null);

    // Use sequence number to fetch the document
    const sequence = doc.sequence?.toString() || '1';

    this.documentService.getDocumentFile(accessionNumber, sequence).subscribe({
      next: (blob) => this.handleDocumentBlob(blob),
      error: (err) => this.handleDocumentError(err),
    });
  }

  handleDocumentBlob(blob: Blob) {
    const reader = new FileReader();
    reader.onload = () => {
      const html = reader.result as string;
      this.documentHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
      this.documentLoading.set(false);
    };
    reader.onerror = () => {
      this.documentError.set('Failed to read document content');
      this.documentLoading.set(false);
    };
    reader.readAsText(blob);
  }

  handleDocumentError(err: any) {
    console.error('Document API error:', err);
    const errorMessage = err.error?.detail || err.message || 'Unknown error';
    this.documentError.set(errorMessage);
    this.documentLoading.set(false);
  }

  retryLoadDocument() {
    const doc = this.selectedDocument();
    if (doc) {
      this.loadDocumentContent(doc);
    }
  }

  getSecGovUrl(): string {
    const filing = this.filing();
    if (!filing) return '#';

    const accessionNoDashes = filing.accessionNumber.replace(/-/g, '');
    return `https://www.sec.gov/Archives/edgar/data/${filing.centralIndexKey}/${accessionNoDashes}/${filing.accessionNumber}-index.htm`;
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  toggleSection(section: 'info' | 'documents' | 'company') {
    this.sections.update((s) => ({ ...s, [section]: !s[section] }));
  }

  getDocIcon(doc: DocumentFile): string {
    const filename = (doc.filename || '').toLowerCase();
    const type = (doc.type || '').toLowerCase();

    if (filename.endsWith('.xml') || type.includes('xml') || type.includes('xbrl')) {
      return 'lucideFileCode';
    }
    if (filename.endsWith('.jpg') || filename.endsWith('.png') || filename.endsWith('.gif') || type === 'graphic') {
      return 'lucideImage';
    }
    if (type.includes('exhibit') || type.startsWith('ex-')) {
      return 'lucideFile';
    }
    return 'lucideFileText';
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
