/**
 * Represents an SEC document.
 * Used by /api/v1/document/{accessionNumber} endpoint.
 */
export interface Document {
  accessionNumber: string;
  formType?: string;
  filedDate?: string;
  acceptedDate?: string;
  documents?: DocumentFile[];
}

/**
 * A file within an SEC document submission.
 */
export interface DocumentFile {
  sequence?: number;
  description?: string;
  filename?: string;
  type?: string;
  size?: number;
  url?: string;
}

/**
 * Metadata for an SEC document.
 * Used by /api/v1/document/{accessionNumber}/meta endpoint.
 */
export interface DocumentMeta {
  accessionNumber: string;
  summary?: string;
  formType?: string;
  fileNumber?: string;
  filmNumber?: string;
  filedDate?: string;
  acceptedDate?: string;
  periodOfReport?: string;
  filerCik?: number;
  filerName?: string;
  primaryDocument?: string;
  primaryDocumentDescription?: string;
  documents?: DocumentFile[];
  filingHeader?: FilingHeader;
  hasXbrl?: boolean;
}

/**
 * Filing header information from document metadata.
 */
export interface FilingHeader {
  accessionNumber?: string;
  conformedSubmissionType?: string;
  publicDocumentCount?: number;
  filedAsOfDate?: string;
  acceptanceDateTime?: string;
  itemInformation?: string[];
}

/**
 * Parsed document content.
 * Used by /api/v1/document/{accessionNumber}/parsed endpoint.
 */
export interface ParsedDocument {
  accessionNumber: string;
  sections?: DocumentSection[];
  tables?: DocumentTable[];
}

/**
 * A section within a parsed document.
 */
export interface DocumentSection {
  title?: string;
  content?: string;
  level?: number;
}

/**
 * A table within a parsed document.
 */
export interface DocumentTable {
  title?: string;
  headers?: string[];
  rows?: string[][];
}

/**
 * Request body for document contexter.
 * Used by POST /api/v1/document/{accessionNumber}/contexter endpoint.
 */
export interface SECFilingDocumentFragment {
  text?: string | null;
  htmlFragment?: string | null;
}

/**
 * Image query options for document images.
 */
export interface DocumentImageOptions {
  width?: number;
  page?: number;
}

