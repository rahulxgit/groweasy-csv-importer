interface Props {
  headers: string[];
  rows: Record<string, string>[];
  maxHeight?: string;
}

// used for both the raw CSV preview and the CRM result table, headers/rows come pre-shaped
export default function DataTable({ headers, rows, maxHeight = '420px' }: Props) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted">
        No rows to display
      </div>
    );
  }

  return (
    <div
      className="overflow-auto rounded-lg border border-border bg-white"
      style={{ maxHeight }}
    >
      <table className="data-table w-full text-left text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap border-b border-border px-3 py-2 font-medium text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50">
              {headers.map((h) => (
                <td key={h} className="whitespace-nowrap px-3 py-2 text-ink">
                  {row[h] || <span className="text-gray-300">-</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
