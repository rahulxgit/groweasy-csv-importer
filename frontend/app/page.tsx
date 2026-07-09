'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import DataTable from '@/components/DataTable';
import ResultSummary from '@/components/ResultSummary';
import { importCsv } from '@/lib/api';
import type { ParsedCsv, ImportResult, Step } from '@/lib/types';

const CRM_HEADERS = [
  'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
  'company', 'city', 'state', 'country', 'lead_owner', 'crm_status', 'crm_note',
  'data_source', 'possession_time', 'description',
];

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(file: File) {
    setStep('processing');
    setError(null);
    try {
      const data = await importCsv(file);
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  }

  function reset() {
    setCsv(null);
    setResult(null);
    setError(null);
    setStep('upload');
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Import Leads via CSV</h1>
          <p className="text-sm text-muted">Upload a CSV file to bulk import leads into GrowEasy</p>
        </div>
        {step !== 'upload' && (
          <button onClick={reset} className="text-sm text-muted hover:text-ink">
            Start over
          </button>
        )}
      </div>

      {step === 'upload' && (
        <UploadZone
          onParsed={(data) => {
            setCsv(data);
            setStep('preview');
          }}
        />
      )}

      {step === 'preview' && csv && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted">
              {csv.fileName} &middot; {csv.rows.length} rows detected
            </p>
          </div>
          <DataTable headers={csv.headers} rows={csv.rows} />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleConfirm(csv.file)}
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Confirm & Import
            </button>
            <button onClick={reset} className="rounded-md border border-border px-5 py-2 text-sm text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-white py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-4 text-sm text-muted">Mapping your data to the CRM schema, this can take a bit for larger files...</p>
        </div>
      )}

      {step === 'result' && result && (
        <div>
          <ResultSummary
            totalRows={result.totalRows}
            totalImported={result.totalImported}
            totalSkipped={result.totalSkipped}
          />
          <DataTable headers={CRM_HEADERS} rows={result.records} />
        </div>
      )}
    </main>
  );
}

