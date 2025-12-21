/**
 * Represents an SEC filing record.
 * Based on the API response from /api/v1/filing/search
 */
export interface Filing {
  id: number;
  accessionNumber: string;
  formType: string;
  companyConformedName: string;
  centralIndexKey: number;
  relationship: string;
  dateFiled: string;
  datePublished: string;
  size: number;
  description: string;
  noDocument: boolean;
  ticker: string;
  tags: string[];
  snowflakeId: string;
  fileNumber: string;
  filmNumber: string;
  sponsorCIK: number | null;
  documentCount: number | null;
  amendedAccessionNumber: string;
  isAmendment: boolean;
  amendmentAccessionNumber: string;
  isAmended: boolean;
  fileName: string;
  isEmpty: boolean;
  absoluteFileUrl: string;
}

/**
 * Request body for POST /api/v1/filing/search
 */
export interface FilingSearchQuery {
  query: string | null;
  save: boolean;
}

/**
 * Response wrapper for POST /api/v1/filing/search
 */
export interface FilingSearchResponse {
  value: Filing[];
  formatters: unknown[];
  contentTypes: unknown[];
  declaredType: unknown;
  statusCode: number;
}

/**
 * Autocomplete suggestion from /api/v1/filing/search/autocomplete
 */
export interface AutocompleteResult {
  word: string;
  type: number;
  category: string | null;
  description: string | null;
  helpUrl: string | null;
}

