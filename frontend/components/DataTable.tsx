interface Props {
  headers: string[];
  rows: Record<string, unknown>[];
  maxHeight?: string;
}

// Used for both the raw CSV preview and the CRM result table.
export default function DataTable({
  headers,
  rows,
  maxHeight = "420px",
}: Props) {
  if (rows.length === 0) {
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
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap border-b border-border px-3 py-2 font-medium text-muted"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border last:border-0 hover:bg-gray-50"
            >
              {headers.map((header) => (
                <td
                  key={header}
                  className="whitespace-nowrap px-3 py-2 text-ink"
                >
                  {row[header] !== undefined &&
                  row[header] !== null &&
                  row[header] !== "" ? (
                    String(row[header])
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}