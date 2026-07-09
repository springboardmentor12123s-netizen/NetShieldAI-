export default function DataTable({ rows = [], empty = "No records found." }) {
  if (!rows.length) {
    return <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">{empty}</div>;
  }
  const columns = Object.keys(rows[0]);
  return (
    <div className="table-wrap">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
          <tr>{columns.map((column) => <th className="px-4 py-3 font-semibold" key={column}>{column.replaceAll("_", " ")}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((row, index) => (
            <tr className="bg-slate-900/20 transition hover:bg-slate-800/40" key={row.id ?? index}>
              {columns.map((column) => (
                <td className="max-w-72 truncate px-4 py-3 text-slate-300" key={column}>
                  {row[column] === null || row[column] === undefined ? "—" : String(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
