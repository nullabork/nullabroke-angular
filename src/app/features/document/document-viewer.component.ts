import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.css',
})
export class DocumentViewerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly filingService = inject(FilingService);
  private readonly documentService = inject(DocumentService);
  private readonly destroyRef = inject(DestroyRef);

  // Convert route params to signal
  accessionNumber = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('accessionNumber'))),
    { initialValue: null }
  );

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

  constructor() {
    // React to route param changes using effect
    effect(() => {
      const accNum = this.accessionNumber();
      if (accNum) {
        this.loadFiling(accNum);
      } else {
        this.error.set('No accession number provided');
        this.loading.set(false);
      }
    });
  }

  loadFiling(accessionNumber: string) {
    // Load filing info and document metadata in parallel
    const query = `accession_number = '${accessionNumber}' limit 1`;

    this.filingService
      .search(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.documentService
      .getDocumentMeta(accessionNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    const accessionNumber = this.accessionNumber();
    if (!accessionNumber) return;

    this.documentLoading.set(true);
    this.documentError.set(null);
    this.documentHtml.set(null);

    // Use sequence number to fetch the document
    const sequence = doc.sequence?.toString() || '1';

    this.documentService
      .getDocumentFile(accessionNumber, sequence)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
