const ctx = self;

const TOTAL_RECORDS = 1_000_000;
const DEFAULT_SORT_KEY = 'lastMessageAt';
const DEFAULT_SORT_DIR = 'desc';

const firstNames = [
  'Ananya',
  'Arjun',
  'Ishita',
  'Rahul',
  'Priya',
  'Neha',
  'Rohan',
  'Kartik',
  'Sanjana',
  'Vikram',
  'Ayesha',
  'Kabir',
  'Zoya',
  'Dev',
  'Mira',
  'Ira',
  'Nikhil',
  'Sahil',
  'Ritika',
  'Anika',
];

const lastNames = [
  'Sharma',
  'Verma',
  'Patel',
  'Singh',
  'Mehta',
  'Garg',
  'Jain',
  'Agarwal',
  'Chaudhary',
  'Desai',
  'Kapoor',
  'Khanna',
  'Malhotra',
  'Bansal',
  'Chopra',
  'Iyer',
  'Menon',
  'Pillai',
  'Rao',
  'Shetty',
];

const addedByNames = [
  'Kartikeya Mishra',
  'Anjali Gupta',
  'Rohit Sen',
  'Divya Singh',
  'Sara Khan',
  'Gautam Iyer',
  'Nisha Patel',
  'Harsh Sharma',
];

const datetimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

let dataStore = null;
const sortCache = new Map();
let lastFilterKey = null;
let lastFilteredIndexes = null;

const pendingQueries = [];
let isReady = false;

ctx.addEventListener('message', (event) => {
  const { type } = event.data;

  if (type === 'init') {
    if (!isReady) {
      buildData(TOTAL_RECORDS);
      isReady = true;
      ctx.postMessage({ type: 'ready', total: TOTAL_RECORDS });
      flushPendingQueries();
    } else {
      ctx.postMessage({ type: 'ready', total: TOTAL_RECORDS });
    }
    return;
  }

  if (!isReady) {
    pendingQueries.push(event.data);
    return;
  }

  if (type === 'query') {
    handleQuery(event.data);
  }
});

function flushPendingQueries() {
  if (pendingQueries.length === 0) return;
  pendingQueries.splice(0).forEach((payload) => handleQuery(payload));
}

function buildData(count) {
  const names = new Array(count);
  const phones = new Array(count);
  const emails = new Array(count);
  const scores = new Uint8Array(count);
  const lastMessageAt = new Float64Array(count);
  const addedBy = new Array(count);
  const avatars = new Array(count);
  const searchIndex = new Array(count);
  const ids = new Array(count);

  const random = createLCG(343597);

  const now = Date.now();
  const oneYearMs = 1000 * 60 * 60 * 24 * 365;

  for (let i = 0; i < count; i += 1) {
    const first = firstNames[Math.floor(random() * firstNames.length)];
    const last = lastNames[Math.floor(random() * lastNames.length)];
    const name = `${first} ${last}`;
    names[i] = name;

    const basePhone = 6000000000 + Math.floor(random() * 3999999999);
    phones[i] = `+91${String(basePhone).padStart(10, '0')}`;

    const emailSuffix = Math.floor(random() * 900 + 100);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${emailSuffix}@example.com`;
    emails[i] = email;

    scores[i] = Math.floor(random() * 101);

    const timestamp = now - Math.floor(random() * oneYearMs);
    lastMessageAt[i] = timestamp;

    addedBy[i] = addedByNames[Math.floor(random() * addedByNames.length)];

    avatars[i] = `https://i.pravatar.cc/64?img=${(i % 70) + 1}`;

    searchIndex[i] = `${name} ${phones[i]} ${email}`.toLowerCase();

    ids[i] = (i + 1).toString();
  }

  dataStore = {
    count,
    ids,
    names,
    phones,
    emails,
    scores,
    lastMessageAt,
    addedBy,
    avatars,
    searchIndex,
  };
}

function handleQuery(payload) {
  const {
    requestId,
    sortKey = DEFAULT_SORT_KEY,
    sortDir = DEFAULT_SORT_DIR,
    searchTerm = '',
    offset = 0,
    limit = 30,
    append = false,
  } = payload;

  if (!dataStore) {
    ctx.postMessage({
      type: 'queryResult',
      requestId,
      rows: [],
      total: 0,
      hasMore: false,
      append,
    });
    return;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredIndexes = getFilteredIndexes(sortKey, sortDir, normalizedSearch);

  if (offset >= filteredIndexes.length) {
    ctx.postMessage({
      type: 'queryResult',
      requestId,
      rows: [],
      total: filteredIndexes.length,
      hasMore: false,
      append,
    });
    return;
  }

  const sliceEnd = Math.min(offset + limit, filteredIndexes.length);
  const rows = new Array(sliceEnd - offset);

  for (let i = offset, rowIndex = 0; i < sliceEnd; i += 1, rowIndex += 1) {
    const recordIndex = filteredIndexes[i];
    rows[rowIndex] = buildRow(recordIndex);
  }

  ctx.postMessage({
    type: 'queryResult',
    requestId,
    rows,
    total: filteredIndexes.length,
    hasMore: sliceEnd < filteredIndexes.length,
    append,
  });
}

function buildRow(index) {
  return {
    id: dataStore.ids[index],
    name: dataStore.names[index],
    phone: dataStore.phones[index],
    email: dataStore.emails[index],
    score: dataStore.scores[index],
    lastMessageAt: datetimeFormatter.format(new Date(dataStore.lastMessageAt[index])),
    addedBy: dataStore.addedBy[index],
    avatar: dataStore.avatars[index],
  };
}

function getFilteredIndexes(sortKey, sortDir, searchTerm) {
  const filterKey = `${sortKey}:${sortDir}:${searchTerm}`;
  if (filterKey === lastFilterKey && lastFilteredIndexes) {
    return lastFilteredIndexes;
  }

  const sortedIndexes = getSortedIndexes(sortKey, sortDir);

  let filtered = sortedIndexes;
  if (searchTerm) {
    const matches = [];
    for (let i = 0; i < sortedIndexes.length; i += 1) {
      const idx = sortedIndexes[i];
      if (dataStore.searchIndex[idx].includes(searchTerm)) {
        matches.push(idx);
      }
    }
    filtered = new Int32Array(matches);
  }

  lastFilterKey = filterKey;
  lastFilteredIndexes = filtered;

  return filtered;
}

function getSortedIndexes(sortKey, sortDir) {
  const cacheKey = `${sortKey}:${sortDir}`;
  if (sortCache.has(cacheKey)) {
    return sortCache.get(cacheKey);
  }

  const { count } = dataStore;
  const indices = new Array(count);
  for (let i = 0; i < count; i += 1) {
    indices[i] = i;
  }

  const comparator = getComparator(sortKey, sortDir);
  indices.sort(comparator);

  const sorted = new Int32Array(indices);
  sortCache.set(cacheKey, sorted);
  return sorted;
}

function getComparator(sortKey, sortDir) {
  const direction = sortDir === 'asc' ? 1 : -1;
  const collator = new Intl.Collator('en', { sensitivity: 'base' });

  switch (sortKey) {
    case 'name':
      return (a, b) => {
        const result = collator.compare(dataStore.names[a], dataStore.names[b]);
        return result === 0 ? (a - b) : result * direction;
      };
    case 'email':
      return (a, b) => {
        const result = collator.compare(dataStore.emails[a], dataStore.emails[b]);
        return result === 0 ? (a - b) : result * direction;
      };
    case 'addedBy':
      return (a, b) => {
        const result = collator.compare(dataStore.addedBy[a], dataStore.addedBy[b]);
        return result === 0 ? (a - b) : result * direction;
      };
    case 'score':
      return (a, b) => {
        const diff = dataStore.scores[a] - dataStore.scores[b];
        return diff === 0 ? (a - b) : diff * direction;
      };
    case 'lastMessageAt':
    default:
      return (a, b) => {
        const diff = dataStore.lastMessageAt[a] - dataStore.lastMessageAt[b];
        if (diff === 0) {
          return (a - b) * direction;
        }
        return diff * direction;
      };
  }
}

function createLCG(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

