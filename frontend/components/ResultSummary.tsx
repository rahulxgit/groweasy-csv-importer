interface Props {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}

export default function ResultSummary({ totalRows, totalImported, totalSkipped }: Props) {
  const cards = [
    { label: 'Total Rows', value: totalRows },
    { label: 'Imported', value: totalImported, color: 'text-green-600' },
    { label: 'Skipped', value: totalSkipped, color: 'text-red-500' },
  ];

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-white p-4">
          <p className="text-xs text-muted">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${c.color || 'text-ink'}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
