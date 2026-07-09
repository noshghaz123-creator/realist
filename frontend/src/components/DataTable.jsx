/**
 * Shared table shell — horizontal scroll on narrow screens, nowrap headers.
 */
export default function DataTable({ columns, children, empty = false, emptyMessage = 'No data yet.', colSpan }) {
  const span = colSpan ?? columns.length;

  return (
    <div className="data-table-shell">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={span} className="data-table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DataCardGrid({ items, renderItem, emptyMessage = 'No data yet.' }) {
  if (!items.length) {
    return (
      <div className="data-card-shell">
        <p className="text-center text-gray-400 text-sm py-10">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-card-shell divide-y divide-gray-100">
      {items.map(renderItem)}
    </div>
  );
}
