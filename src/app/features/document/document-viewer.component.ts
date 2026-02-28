import { 
  ChangeDetectionStrategy, 
  Component, 
  DestroyRef, 
  effect, 
  inject, 
  signal, 
  HostListener,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
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

import { AppChromeService } from '../../core/services/app-chrome.service';
import { FilingService } from '../../core/services/filing.service';
import { DocumentService } from '../../core/services/document.service';
import { XbrlParserService } from '../../core/services/xbrl-parser.service';
import { Filing } from '../../core/models/filing.model';
import { DocumentFile, DocumentMeta, XbrlReport } from '../../core/models/document.model';

/**
 * Selection data received from iframe postMessage
 */
interface SelectionData {
  Text: string;
  [key: string]: unknown;
}

/**
 * Mouse position received from iframe postMessage
 */
interface MousePosition {
  x: number;
  y: number;
}

/**
 * PostMessage event data structure
 */
interface IframeMessage {
  t: 'height' | 'selection';
  d: number | SelectionData;
  m?: MousePosition;
}

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
  private readonly appChrome = inject(AppChromeService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly filingService = inject(FilingService);
  private readonly documentService = inject(DocumentService);
  private readonly xbrlParser = inject(XbrlParserService);
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

  // Iframe state
  iframeSrc = signal<SafeResourceUrl | null>(null);
  iframeHeight = signal<number | string>('100%');
  iframeLoading = signal(false);

  // Selection context (for future AI/context features)
  selectionContext = signal<SelectionData | null>(null);

  // XBRL viewer state
  xbrlMode = signal(false);
  xbrlReports = signal<XbrlReport[]>([]);
  xbrlReportNames = signal<Map<string, string>>(new Map());
  selectedXbrlReport = signal<XbrlReport | null>(null);
  xbrlReportHtml = signal<SafeHtml | null>(null);
  xbrlLoading = signal(false);

  sections = signal({
    info: true,
    documents: true,
    company: false,
  });

  constructor() {
    this.appChrome.visible.set(true);
    this.destroyRef.onDestroy(() => this.appChrome.visible.set(false));

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

  /**
   * Listen for postMessage events from iframe
   */
  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent<IframeMessage>) {
    // Validate message origin (optional - API should be trusted)
    // if (!event.origin.includes('api.nullabroke.com')) return;

    const data = event.data;
    if (!data || typeof data !== 'object' || !data.t) return;

    switch (data.t) {
      case 'height':
        // Update iframe height from document content
        if (typeof data.d === 'number') {
          this.iframeHeight.set(data.d);
          this.iframeLoading.set(false);
        }
        break;

      case 'selection':
        // Handle text selection for context/AI analysis
        if (data.d && typeof data.d === 'object' && 'Text' in data.d) {
          const selectionData = data.d as SelectionData;
          if (selectionData.Text) {
            this.selectionContext.set(selectionData);
            // TODO: Trigger AI context analysis
            // TODO: Trigger AI context analysis
          } else {
            this.selectionContext.set(null);
          }
        } else {
          this.selectionContext.set(null);
        }
        break;
    }
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

    if (this.isXbrlDocument(doc)) {
      this.enterXbrlMode();
    } else {
      if (this.xbrlMode()) {
        this.exitXbrlMode();
      }
      this.loadDocumentInIframe(doc);
    }
  }

  isXbrlDocument(doc: DocumentFile): boolean {
    const desc = (doc.description || '').toUpperCase();
    const filename = (doc.filename || '').toLowerCase();
    return desc.includes('XBRL') || filename === 'filingsummary.xml';
  }

  enterXbrlMode() {
    const accessionNumber = this.accessionNumber();
    if (!accessionNumber) return;

    // Find FilingSummary.xml in the document list
    const summaryDoc = this.documents().find(
      (d) => (d.filename || '').toLowerCase() === 'filingsummary.xml'
    );

    if (!summaryDoc?.sequence) {
      // No FilingSummary.xml found — fall back to iframe for this XBRL doc
      const doc = this.selectedDocument();
      if (doc) {
        this.loadDocumentInIframe(doc);
      }
      return;
    }

    this.xbrlMode.set(true);
    this.xbrlLoading.set(true);
    this.iframeSrc.set(null);

    // Fetch and parse FilingSummary.xml
    this.documentService
      .getDocumentText(accessionNumber, summaryDoc.sequence)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (xml) => {
          const reports = this.xbrlParser.parseFilingSummary(xml);
          this.xbrlReports.set(reports);

          // Build filename→shortName map for sidebar labels
          const nameMap = new Map<string, string>();
          for (const report of reports) {
            nameMap.set(report.htmlFileName.toLowerCase(), report.shortName);
          }
          this.xbrlReportNames.set(nameMap);

          // Auto-select first report
          if (reports.length > 0) {
            this.selectXbrlReport(reports[0]);
          } else {
            this.xbrlLoading.set(false);
          }
        },
        error: (err) => {
          console.error('Failed to load FilingSummary.xml:', err);
          this.xbrlLoading.set(false);
        },
      });
  }

  selectXbrlReport(report: XbrlReport) {
    const accessionNumber = this.accessionNumber();
    if (!accessionNumber) return;

    this.selectedXbrlReport.set(report);
    this.xbrlLoading.set(true);
    this.xbrlReportHtml.set(null);

    // Find the R*.htm file in documents list by matching filename
    const reportDoc = this.documents().find(
      (d) => (d.filename || '').toLowerCase() === report.htmlFileName.toLowerCase()
    );

    if (!reportDoc?.sequence) {
      this.xbrlLoading.set(false);
      return;
    }

    this.documentService
      .getDocumentText(accessionNumber, reportDoc.sequence)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (html) => {
          this.xbrlReportHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
          this.xbrlLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load XBRL report:', err);
          this.xbrlLoading.set(false);
        },
      });
  }

  exitXbrlMode() {
    this.xbrlMode.set(false);
    this.xbrlReports.set([]);
    this.selectedXbrlReport.set(null);
    this.xbrlReportHtml.set(null);
    this.xbrlLoading.set(false);
  }

  getXbrlReportName(doc: DocumentFile): string | null {
    const filename = (doc.filename || '').toLowerCase();
    return this.xbrlReportNames().get(filename) || null;
  }

  /**
   * Called when iframe finishes loading its content.
   */
  onIframeLoad() {
    this.iframeLoading.set(false);
  }

  /**
   * Load document into iframe using direct API URL
   */
  loadDocumentInIframe(doc: DocumentFile) {
    const accessionNumber = this.accessionNumber();
    if (!accessionNumber) return;

    this.iframeLoading.set(true);
    this.iframeHeight.set('100%'); // Reset height until we get postMessage
    this.selectionContext.set(null);

    // Build the document URL
    const sequence = doc.sequence?.toString() || '1';
    const rawUrl = this.documentService.getDocumentUrl(accessionNumber, sequence);
    
    // Sanitize URL for iframe src
    this.iframeSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
  }

  retryLoadDocument() {
    const doc = this.selectedDocument();
    if (doc) {
      this.loadDocumentInIframe(doc);
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
