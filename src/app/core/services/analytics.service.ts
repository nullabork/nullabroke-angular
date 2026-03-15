import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly enabled = typeof window !== 'undefined' && window.location.hostname === 'nullabroke.com';

  private push(event: Record<string, unknown>) {
    if (!this.enabled) return;
    const w = window as unknown as { dataLayer: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push(event);
  }

  trackSearch(queryName: string, resultCount: number) {
    this.push({
      event: 'query_search',
      query_name: queryName,
      result_count: resultCount,
    });
  }

  trackNewQuery() {
    this.push({ event: 'query_create' });
  }

  trackSelectQuery(queryName: string) {
    this.push({
      event: 'query_select',
      query_name: queryName,
    });
  }

  trackDocumentView(accessionNumber: string, documentNumber: string) {
    this.push({
      event: 'document_view',
      accession_number: accessionNumber,
      document_number: documentNumber,
    });
  }
}
