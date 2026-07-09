export type CsvRow = Record<string, string>;

export interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
  fileName: string;
  file: File;
}

export interface CrmRecord {
  [key: string]: string | number | boolean | null | undefined;

  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface ImportResult {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  records: CrmRecord[];
}

export type Step = 'upload' | 'preview' | 'processing' | 'result';
