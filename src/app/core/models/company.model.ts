/**
 * Represents a company from SEC filings.
 * Used by /api/v1/company/{cik} endpoint.
 */
export interface Company {
  cik: number;
  name: string;
  ticker?: string;
  sic?: string;
  sicDescription?: string;
  fiscalYearEnd?: string;
  stateOfIncorporation?: string;
  businessAddress?: Address;
  mailingAddress?: Address;
}

/**
 * Address information for a company.
 */
export interface Address {
  street1?: string;
  street2?: string;
  city?: string;
  stateOrCountry?: string;
  zipCode?: string;
}

/**
 * Holding information for a company.
 * Used by /api/v1/company/{cik}/holdings endpoint.
 */
export interface Holding {
  cusip?: string;
  issuerName?: string;
  titleOfClass?: string;
  value?: number;
  shares?: number;
  sharesPrnAmt?: string;
  investmentDiscretion?: string;
  votingAuthoritySole?: number;
  votingAuthorityShared?: number;
  votingAuthorityNone?: number;
}

/**
 * Holder information - who holds positions in a company.
 * Used by /api/v1/company/{cik}/holders endpoint.
 */
export interface Holder {
  cik?: number;
  filerName?: string;
  shares?: number;
  value?: number;
  changeInShares?: number;
  changeInValue?: number;
  percentOfPortfolio?: number;
}

/**
 * Holder overtime data point.
 * Used by /api/v1/company/{cik}/holders/overtime endpoint.
 */
export interface HolderOvertime {
  period?: string;
  totalHolders?: number;
  totalShares?: number;
  totalValue?: number;
}

/**
 * Subsidiary information.
 * Used by /api/v1/company/{cik}/subsidiaries endpoint.
 */
export interface Subsidiary {
  name?: string;
  jurisdiction?: string;
}

/**
 * Company search result.
 * Used by /api/v1/company/companies/search and quicksearch endpoints.
 */
export interface CompanySearchResult {
  cik: number;
  name: string;
  ticker?: string;
}

