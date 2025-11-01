import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomerTable } from './components/CustomerTable.jsx';
import { FiltersDropdown } from './components/FiltersDropdown.jsx';
import { SearchInput } from './components/SearchInput.jsx';
import { useDebounce } from './hooks/useDebounce.js';
import './App.css';

const PAGE_SIZE = 30;
const defaultSort = { key: 'lastMessageAt', dir: 'desc' };

function App() {
  const [workerReady, setWorkerReady] = useState(false);
  const [rows, setRows] = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 250);

  const [sortState, setSortState] = useState(defaultSort);

  const workerRef = useRef(null);
  const requestRef = useRef({ id: null, append: false });
  const tableContainerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const worker = new Worker(new URL('./workers/dataWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    function handleMessage(event) {
      const { type, ...payload } = event.data;
      if (type === 'ready') {
        setWorkerReady(true);
        setMatchCount(payload.total);
        return;
      }

      if (type === 'queryResult') {
        if (payload.requestId !== requestRef.current.id) {
          return;
        }

        setRows((prev) => (payload.append ? [...prev, ...payload.rows] : payload.rows));
        setMatchCount(payload.total);
        setHasMore(payload.hasMore);
        setIsFetching(false);
      }
    }

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ type: 'init' });

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
    };
  }, []);

  const requestData = useCallback(
    (offset, append) => {
      if (!workerRef.current) return;
      const requestId = `${performance.now()}-${Math.random().toString(16).slice(2)}`;
      requestRef.current = { id: requestId, append };
      setIsFetching(true);
      workerRef.current.postMessage({
        type: 'query',
        requestId,
        append,
        sortKey: sortState.key,
        sortDir: sortState.dir,
        searchTerm: debouncedSearch,
        offset,
        limit: PAGE_SIZE,
      });
    },
    [debouncedSearch, sortState.key, sortState.dir],
  );

  useEffect(() => {
    if (!workerReady) return;
    setRows([]);
    setHasMore(true);
    requestData(0, false);
  }, [workerReady, sortState, debouncedSearch, requestData]);

  const loadMore = useCallback(() => {
    if (!workerReady || isFetching || !hasMore) return;
    requestData(rows.length, true);
  }, [workerReady, isFetching, hasMore, rows.length, requestData]);

  useEffect(() => {
    const container = tableContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMore();
          }
        });
      },
      {
        root: container,
        rootMargin: '200px',
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMore]);

  const handleSortChange = useCallback((columnKey) => {
    setSortState((prev) => {
      if (prev.key === columnKey) {
        const nextDir = prev.dir === 'asc' ? 'desc' : 'asc';
        return { key: columnKey, dir: nextDir };
      }
      return { key: columnKey, dir: 'asc' };
    });
  }, []);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const summaryLabel = useMemo(() => numberFormatter.format(matchCount), [matchCount, numberFormatter]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 12L9 17L20 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="brand-name">DoubleTick</span>
        </div>
      </header>
      <main className="app-content">
        <section className="customers-header">
          <div>
            <h1>All Customers</h1>
            <span className="customers-count">{summaryLabel}</span>
          </div>
          <div className="customers-actions">
            <SearchInput value={searchValue} onChange={setSearchValue} />
            <FiltersDropdown />
          </div>
        </section>
        <section className="customers-table-section">
          <div className="table-wrapper" ref={tableContainerRef}>
            <CustomerTable rows={rows} sortKey={sortState.key} sortDir={sortState.dir} onSortChange={handleSortChange} />
            <div ref={sentinelRef} className="table-sentinel" aria-hidden="true" />
            {isFetching && (
              <div className="table-status">Loading...</div>
            )}
            {!isFetching && rows.length === 0 && (
              <div className="table-status empty">No customers found</div>
            )}
            {!isFetching && rows.length > 0 && !hasMore && (
              <div className="table-status">You've reached the end</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
