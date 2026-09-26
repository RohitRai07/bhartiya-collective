/**
 * Registration CSV Exporter
 * 
 * Isolated Export Utility:
 * - Strict 10-column mapping as mandated:
 *   1. First Name
 *   2. Middle Name
 *   3. Last Name
 *   4. Phone Number
 *   5. College Name
 *   6. Address
 *   7. Pincode
 *   8. City
 *   9. State
 *   10. District
 * - Single-record CSV download
 * - Bulk/filtered CSV download
 * - RFC 4180 CSV escaping with UTF-8 BOM for Microsoft Excel compatibility
 * - Decoupled from UI components and easily supplemented or replaced by backend export
 */

import { UserRegistrationRecord } from '../types/registration';

export interface CsvColumnDefinition<T> {
  header: string;
  accessor: (record: T) => string;
}

/**
 * Strict 10-column specification for Bharat Collective Candidate Registrations
 */
export const REGISTRATION_10_COLUMNS: CsvColumnDefinition<UserRegistrationRecord>[] = [
  { header: 'First Name', accessor: r => r.firstName || '' },
  { header: 'Middle Name', accessor: r => r.middleName || '' },
  { header: 'Last Name', accessor: r => r.lastName || '' },
  { 
    header: 'Phone Number', 
    accessor: r => r.phoneNumber?.fullFormatted || (r.phoneNumber ? `${r.phoneNumber.countryCode || '+91'} ${r.phoneNumber.nationalNumber || ''}`.trim() : '')
  },
  { header: 'College Name', accessor: r => r.collegeName || '' },
  { header: 'Address', accessor: r => r.address || '' },
  { header: 'Pincode', accessor: r => r.pincode || '' },
  { header: 'City', accessor: r => r.city || '' },
  { header: 'State', accessor: r => r.state || '' },
  { header: 'District', accessor: r => r.district || '' },
];

export const REGISTRATION_CSV_COLUMNS = REGISTRATION_10_COLUMNS;

/**
 * Escape a cell value according to RFC 4180 rules
 */
function escapeCsvValue(val: string): string {
  if (!val) return '';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV text from an array of registration records using the 10 standard columns
 */
export function generateRegistrationCsv(records: UserRegistrationRecord[]): string {
  const headerRow = REGISTRATION_10_COLUMNS.map(col => escapeCsvValue(col.header)).join(',');

  const dataRows = records.map(record => {
    return REGISTRATION_10_COLUMNS.map(col => {
      const val = col.accessor(record);
      return escapeCsvValue(val);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Trigger browser file download of CSV
 */
function triggerDownload(csvContent: string, filename: string): void {
  if (typeof window === 'undefined') return;
  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 text with correct Indian/special characters
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download a single registration record as CSV
 */
export function downloadSingleRegistrationCsv(
  record: UserRegistrationRecord,
  filename?: string
): void {
  const safeName = `${record.firstName}_${record.lastName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const actualFilename = filename || `candidate_${record.registrationNumber || safeName}.csv`;
  const csvContent = generateRegistrationCsv([record]);
  triggerDownload(csvContent, actualFilename);
}

/**
 * Download multiple registration records as bulk CSV
 */
export function downloadBulkRegistrationCsv(
  records: UserRegistrationRecord[],
  filename?: string
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const actualFilename = filename || `bharat_collective_candidates_${dateStr}.csv`;
  const csvContent = generateRegistrationCsv(records);
  triggerDownload(csvContent, actualFilename);
}

export const registrationCsvExporter = {
  columns: REGISTRATION_10_COLUMNS,
  generateCsv: generateRegistrationCsv,
  downloadCsv: downloadBulkRegistrationCsv,
  downloadSingleRegistrationCsv,
  downloadBulkRegistrationCsv,
};
