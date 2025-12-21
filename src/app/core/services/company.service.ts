import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Company,
  CompanySearchResult,
  Holder,
  HolderOvertime,
  Holding,
  Subsidiary,
} from '../models/company.model';

/**
 * Service for interacting with SEC Company API endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/company`;

  /**
   * Get a company by CIK (Central Index Key).
   * @param cik - The company's CIK number
   */
  getCompany(cik: number): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/${cik}`);
  }

  /**
   * Get holdings for a company (positions they hold).
   * @param cik - The company's CIK number
   * @param accessionNumber1 - First accession number for comparison
   * @param accessionNumber2 - Second accession number for comparison
   * @param limit - Maximum number of results (default: 5000)
   */
  getHoldings(
    cik: number,
    accessionNumber1: string,
    accessionNumber2: string,
    limit = 5000
  ): Observable<Holding[]> {
    const params = new HttpParams()
      .set('accessionNumber1', accessionNumber1)
      .set('accessionNumber2', accessionNumber2)
      .set('limit', limit.toString());
    return this.http.get<Holding[]>(`${this.baseUrl}/${cik}/holdings`, { params });
  }

  /**
   * Get holders of a company (who holds positions in them).
   * @param cik - The company's CIK number
   * @param current - Current period date (ISO 8601)
   * @param previous - Previous period date for comparison (ISO 8601)
   * @param limit - Maximum number of results (default: 100)
   */
  getHolders(cik: number, current?: string, previous?: string, limit = 100): Observable<Holder[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (current) {
      params = params.set('current', current);
    }
    if (previous) {
      params = params.set('previous', previous);
    }
    return this.http.get<Holder[]>(`${this.baseUrl}/${cik}/holders`, { params });
  }

  /**
   * Get historical holder data over time.
   * @param cik - The company's CIK number
   */
  getHoldersOvertime(cik: number): Observable<HolderOvertime[]> {
    return this.http.get<HolderOvertime[]>(`${this.baseUrl}/${cik}/holders/overtime`);
  }

  /**
   * Get subsidiaries of a company.
   * @param cik - The company's CIK number
   */
  getSubsidiaries(cik: number): Observable<Subsidiary[]> {
    return this.http.get<Subsidiary[]>(`${this.baseUrl}/${cik}/subsidiaries`);
  }

  /**
   * Search for companies by name/text.
   * @param query - Search query string
   */
  searchCompanies(query: string): Observable<CompanySearchResult[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<CompanySearchResult[]>(`${this.baseUrl}/companies/search`, { params });
  }

  /**
   * Quick search for companies (autocomplete-style).
   * @param text - Search text
   */
  quickSearch(text: string): Observable<CompanySearchResult[]> {
    const params = new HttpParams().set('text', text);
    return this.http.get<CompanySearchResult[]>(`${this.baseUrl}/quicksearch`, { params });
  }
}

