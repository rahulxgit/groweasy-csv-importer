'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import type { ParsedCsv } from '@/lib/types';

const MAX_SIZE = 5 * 1024 * 1024;

interface Props {
  onParsed: (data: ParsedCsv) => void;
}

export default function UploadZone({ onParsed }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Max size is 5MB.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        if (!headers.length) {
          setError('Could not find any columns in this file');
          return;
        }
        onParsed({
          headers,
          rows: results.data as Record<string, string>[],
          fileName: file.name,
          file,
        });
      },
      error: (err) => setError(`Failed to parse CSV: ${err.message}`),
    });
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          dragActive ? 'border-accent bg-orange-50' : 'border-border bg-white hover:border-gray-400'
        }`}
      >
        <p className="text-sm font-medium text-ink">Drop your CSV file here</p>
        <p className="mt-1 text-xs text-muted">or click to browse files</p>
        <p className="mt-3 text-xs text-muted">Supported file: .csv (max 5MB)</p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
