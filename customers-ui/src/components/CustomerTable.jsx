const columns = [
  { key: 'name', label: 'Customer', align: 'left', width: '32%' },
  { key: 'score', label: 'Score', align: 'center', width: '10%' },
  { key: 'email', label: 'Email', align: 'left', width: '28%' },
  { key: 'lastMessageAt', label: 'Last message sent at', align: 'left', width: '20%' },
  { key: 'addedBy', label: 'Added by', align: 'left', width: '10%' },
];

export function CustomerTable({ rows, sortKey, sortDir, onSortChange }) {
  return (
    <table className="customers-table">
      <thead>
        <tr>
          <th className="checkbox-column" aria-label="Select all" scope="col">
            <input type="checkbox" disabled />
          </th>
          {columns.map((column) => {
            const isActive = sortKey === column.key;
            return (
              <th
                key={column.key}
                style={{ textAlign: column.align, width: column.width }}
                onClick={() => onSortChange(column.key)}
                role="button"
                tabIndex={0}
                scope="col"
                aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSortChange(column.key);
                  }
                }}
              >
                <span className="column-label">{column.label}</span>
                <SortIndicator active={isActive} direction={sortDir} />
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="checkbox-column">
              <input type="checkbox" aria-label={`Select customer ${row.name}`} />
            </td>
            <td>
              <div className="customer-cell">
                <img src={row.avatar} alt="" className="customer-avatar" loading="lazy" />
                <div className="customer-details">
                  <span className="customer-name">{row.name}</span>
                  <span className="customer-phone">{row.phone}</span>
                </div>
              </div>
            </td>
            <td className="score-cell">{row.score}</td>
            <td>
              <span className="customer-email">{row.email}</span>
            </td>
            <td>
              <span className="customer-date">{row.lastMessageAt}</span>
            </td>
            <td>
              <div className="added-by">
                <span className="added-by-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 11C7.23858 11 5 13.2386 5 16H15C15 13.2386 12.7614 11 10 11Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 10C11.6569 10 13 8.65685 13 7C13 5.34315 11.6569 4 10 4C8.34315 4 7 5.34315 7 7C7 8.65685 8.34315 10 10 10Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>{row.addedBy}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SortIndicator({ active, direction }) {
  return (
    <span className={`sort-indicator${active ? ' active' : ''}`} aria-hidden="true">
      <svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5 1L1 5H9L5 1Z"
          fill={active && direction === 'asc' ? '#2563eb' : '#cbd5f5'}
        />
        <path
          d="M5 15L9 11H1L5 15Z"
          fill={active && direction === 'desc' ? '#2563eb' : '#cbd5f5'}
        />
      </svg>
    </span>
  );
}

