# DoubleTick Customers UI

A high-performance React + Vite application that renders a customer directory of **1 million** records with infinite scroll, debounced search, and sortable columns. Data is generated locally and kept in-memory for the lifetime of the session (no network calls).

## Features

- Infinite scroll that loads 30 records per request with sticky headers and smooth scrolling
- Debounced search (250 ms) across customer name, email, and phone
- Column sorting (ascending/descending) for name, score, email, last message date, and added-by owner
- Static "Add Filters" dropdown matching the provided visual reference
- Web Worker powered data layer that keeps the main thread free for rendering
- Responsive, accessible UI built with plain CSS (no utility frameworks)

## Getting Started

### Prerequisites

- Node.js 22 or newer

### Installation

```bash
npm install
```

### Development server

```bash
npm run dev
```

The app starts on `http://localhost:5173` by default.

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Implementation Notes

- A dedicated Web Worker (`src/workers/dataWorker.js`) generates the 1M customer records, caches sorted index arrays per column/direction, and serves paginated responses back to the UI.
- Search filters run in the worker using cached lowercase composites to keep interactions snappy even on the full dataset.
- The React layer requests data in 30-row pages and renders them inside a scroll container tracked by an `IntersectionObserver` for auto-loading.
- Styling lives in `src/App.css`, keeping to plain CSS per the requirements while recreating the provided layout.

## Keyboard & Screen Reader Notes

- Column headers expose `aria-sort` and support `Enter`/`Space` to toggle sorting.
- The search input has an off-screen label for accessibility; filter items are standard buttons in a menu role.

## Testing Checklist

- [x] `npm run build`
- [x] Manual verification of search, sort toggles, infinite scroll, and sticky header behaviour.
