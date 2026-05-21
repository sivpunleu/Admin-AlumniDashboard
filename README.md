# Alumni Admin Dashboard

Vue 3 + Vite admin dashboard for managing alumni accounts, departments,
generations, categories, events, participants, and profile settings.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm

## Setup

```sh
npm install
```

Create a local environment file if you need to point the dashboard at a
different API:

```sh
VITE_API_BASE_URL=https://example.com/api/v1
```

If `VITE_API_BASE_URL` is not set, the app uses the default API base URL in
`src/config/apiBaseUrl.js`.

## Development

```sh
npm run dev
```

## Verification

```sh
npm run lint
npm run build
```

## Preview Production Build

```sh
npm run preview
```
