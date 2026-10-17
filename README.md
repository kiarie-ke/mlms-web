# MODARA LMS Web

React 18 and Vite frontend for the MODARA Learning Management System. Tailwind CSS provides styling, and the app can be installed as a Progressive Web App.

## Requirements

- Node.js 20 or later
- npm
- The MODARA LMS API running on `http://localhost:3000` for local development

## Local setup

```sh
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). The development server proxies `/api` requests to `http://localhost:3000`; start the API separately for authentication and application data.

## Production build

```sh
npm ci
npm run build
npm run preview
```

The production files are generated in `dist/`. Configure the production web server to serve these files and proxy `/api` requests to the API origin. Keep the web app and API on the intended trusted origins because authentication uses secure, HTTP-only cookies.
