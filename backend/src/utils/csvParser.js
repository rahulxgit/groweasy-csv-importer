import { parse } from 'csv-parse/sync';

// csv-parse handles quoted fields, embedded commas etc way better than a manual split
// columns: true gives us objects keyed by header instead of arrays
export function parseCsvBuffer(buffer) {
  const raw = buffer.toString('utf-8');

  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true, // some exports have ragged rows, don't blow up on it
  });

  if (!records.length) {
    throw new Error('CSV appears to be empty');
  }

  return {
    headers: Object.keys(records[0]),
    rows: records,
  };
}
