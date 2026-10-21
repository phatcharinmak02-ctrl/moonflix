# Series Finder

Responsive React and Tailwind CSS app for searching TV series with the TVmaze API.
Member accounts use the React Course API at `https://react-api.dev2life.workers.dev/api/v1`. The Express backend forwards authenticated catalog requests to TVmaze.
Search suggestions are fetched from TVmaze as you type, and the latest eight
searches are saved in the browser's local storage. The full-width responsive
navbar centers search on desktop. On mobile, search expands from a navbar button
and language/theme controls plus genre and platform filters are available in a
left-side slide-out menu. Language and light/dark theme preferences persist in
the browser. The home page loads TVmaze's series catalog without requiring a
search. The catalog is paginated by TVmaze; use Load More to fetch later pages.
Genre and platform dropdowns filter the loaded series, while title search remains
available from the navbar.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The development command starts both the
React frontend and the Express API. Searches use `/api/shows/search?q=...`, and
the Vite development server proxies `/api` requests to the backend.

## Authentication API

Copy `.env.example` to `.env` and set `VITE_API_URL` if you want to change the authentication API. The default is `https://react-api.dev2life.workers.dev/api/v1`.

Registration and login use the API directly. The app stores access and refresh tokens locally, restores the account through `/auth/me`, and refreshes expired access tokens through `/auth/refresh`.

## Production

```sh
npm run build
npm start
```

The production server serves the built frontend and exposes the same search API.
