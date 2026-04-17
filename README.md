# Ledger Premium SaaS

Modern accounting SaaS monorepo with a premium React frontend and a secure Express API.

## Stack

- Frontend: React 19, Vite 6, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Router
- Backend: Express 4, TypeScript, Mongoose, Passport Google OAuth, JWT, Helmet, rate limiting
- Reporting: Chart.js, jsPDF, CSV export

## Features

- Google OAuth only authentication
- JWT session handling with protected routes
- User and admin roles
- Dashboard, transactions, invoices, reports, PDF export
- Private admin route at /admin-secret
- Responsive premium UI

## Project Structure

```text
backend/
frontend/
package.json
```

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB local instance if you want persistent data

Note: if MongoDB is not available locally, the backend can run with an in-memory database for development.

## Installation

```bash
npm install
```

## Development

Run frontend and backend together from the repository root:

```bash
npm run dev
```

Default URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

If you change the backend port, also set VITE_API_URL for the frontend.

Example with backend on port 4001:

```powershell
$env:PORT="4001"
$env:VITE_API_URL="http://localhost:4001/api"
npm run dev
```

## Backend Environment Variables

The backend reads its configuration from environment variables defined in [backend/src/config/env.ts](backend/src/config/env.ts).

| Variable | Default | Description |
| --- | --- | --- |
| NODE_ENV | development | Runtime mode |
| PORT | 4000 | Backend HTTP port |
| CLIENT_URL | http://localhost:5173 | Allowed frontend origin |
| MONGODB_URI | mongodb://127.0.0.1:27017/ledger-premium-saas | Persistent MongoDB connection string |
| USE_IN_MEMORY_DB | false | Uses mongodb-memory-server for local development |
| JWT_SECRET | development-super-secret-key | JWT signing secret |
| JWT_EXPIRES_IN | 7d | JWT expiration |
| GOOGLE_CLIENT_ID | - | Google OAuth client id |
| GOOGLE_CLIENT_SECRET | - | Google OAuth client secret |
| GOOGLE_CALLBACK_URL | - | Google OAuth callback URL |
| CLOUDINARY_CLOUD_NAME | - | Cloudinary cloud name |
| CLOUDINARY_API_KEY | - | Cloudinary API key |
| CLOUDINARY_API_SECRET | - | Cloudinary API secret |
| ADMIN_EMAILS | - | Comma-separated list of admin emails |

## Running Without Local MongoDB

For local development only, you can start the backend with an ephemeral in-memory MongoDB instance:

```powershell
$env:USE_IN_MEMORY_DB="true"
npm run dev --workspace backend
```

Important: data stored in memory is lost when the server stops.

## Scripts

Root:

```bash
npm run dev
npm run build
npm run typecheck
```

Backend:

```bash
npm run dev --workspace backend
npm run build --workspace backend
npm run typecheck --workspace backend
```

Frontend:

```bash
npm run dev --workspace frontend
npm run build --workspace frontend
npm run typecheck --workspace frontend
```

## Production Build

```bash
npm run build
```

Backend output is generated in backend/dist and frontend output in frontend/dist.

## Deploy on Render

This repository includes a Render blueprint at [render.yaml](render.yaml).

1. Push this repository to GitHub.
2. In Render, create a new **Blueprint** and select this repository.
3. Render will create:
   - `ledger-backend` (Node web service)
   - `ledger-frontend` (static site)
4. Set all backend secrets marked with `sync: false` in `render.yaml`.
5. Update these values after services are created:
   - `CLIENT_URL` (backend) to your real frontend URL
   - `VITE_API_URL` (frontend) to your real backend URL + `/api`
   - `GOOGLE_CALLBACK_URL` to `https://<your-backend-domain>/api/auth/google/callback`

## Notes

- The frontend API base URL defaults to http://localhost:4000/api.
- Google OAuth must be configured before login can work.
- Cloudinary variables are optional unless avatar upload is required.
