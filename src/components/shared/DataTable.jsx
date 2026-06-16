import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 8,
  onRowClick,
  actions,
  emptyMessage = 'No data found',
  extraSearchKeys = [],
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter(row => {
      // Search visible columns
      const inColumns = columns.some(col => {
        const value = col.accessor ? row[col.accessor] : '';
        return String(value).toLowerCase().includes(lowerSearch);
      });
      if (inColumns) return true;

      // Search extra keys
      return extraSearchKeys.some(key => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, search, columns, extraSearchKeys]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="glass-card overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="input-field pl-9 !rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              {columns.map(col => (
                <th
                  key={col.accessor || col.header}
                  className="px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                  onClick={() => col.accessor && handleSort(col.accessor)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortConfig.key === col.accessor && (
                      <span className="text-primary-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-surface-400 dark:text-surface-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`border-b border-surface-100 dark:border-surface-800 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50' : 'hover:bg-surface-50/50 dark:hover:bg-surface-800/30'}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td key={col.accessor || col.header} className="px-4 py-3.5 text-sm text-surface-700 dark:text-surface-300">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors">
              <ChevronsLeft size={16} className="text-surface-600 dark:text-surface-400" />
            </button>
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} className="text-surface-600 dark:text-surface-400" />
            </button>
            <span className="px-3 py-1 text-xs font-medium text-surface-600 dark:text-surface-400">
              {currentPage} / {totalPages}
            </span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors">
              <ChevronRight size={16} className="text-surface-600 dark:text-surface-400" />
            </button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors">
              <ChevronsRight size={16} className="text-surface-600 dark:text-surface-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
