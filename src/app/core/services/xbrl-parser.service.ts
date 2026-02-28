import { Injectable } from '@angular/core';
import { XbrlReport } from '../models/document.model';

/**
 * Parses FilingSummary.xml from SEC XBRL filings
 * into structured report metadata.
 */
@Injectable({
  providedIn: 'root',
})
export class XbrlParserService {
  /**
   * Parse FilingSummary.xml content into an array of XBRL reports.
   * Filters out the "All Reports" book entry and sorts by position.
   */
  parseFilingSummary(xml: string): XbrlReport[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error('Failed to parse FilingSummary.xml:', parseError.textContent);
      return [];
    }

    const reportElements = doc.querySelectorAll('MyReports > Report');
    const reports: XbrlReport[] = [];

    reportElements.forEach((el) => {
      const reportType = this.getTextContent(el, 'ReportType');
      const htmlFileName = this.getTextContent(el, 'HtmlFileName');

      // Skip the "All Reports" book entry and reports without HTML files
      if (reportType === 'Book' || !htmlFileName) {
        return;
      }

      reports.push({
        shortName: this.getTextContent(el, 'ShortName') || htmlFileName,
        longName: this.getTextContent(el, 'LongName') || '',
        htmlFileName,
        menuCategory: this.getTextContent(el, 'MenuCategory') || '',
        position: parseInt(this.getTextContent(el, 'Position') || '0', 10),
        reportType,
        role: this.getTextContent(el, 'Role') || undefined,
      });
    });

    return reports.sort((a, b) => a.position - b.position);
  }

  private getTextContent(parent: Element, tagName: string): string {
    return parent.querySelector(tagName)?.textContent?.trim() || '';
  }
}
