# Ledger Premium SaaS

Modern accounting SaaS monorepo with a premium React frontend and a secure Express API.

## Stack

- Frontend: React 19, Vite 6, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Router
- Backend: Express 4, TypeScript, Mongoose, Firebase ID token verification, JWT, Helmet, rate limiting
- Reporting: Chart.js, jsPDF, CSV export

## Features

- Firebase Auth with email/password sign in and sign up
- JWT session handling with protected routes
- MongoDB-backed user persistence after Firebase token verification
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
- Firebase project with Email/Password authentication enabled
- A persistent MongoDB instance for real development data

The repository includes a docker-compose MongoDB service so local development can use a real persisted database immediately. If Docker is not available, point MONGODB_URI to an existing MongoDB server.

## Installation

```bash
npm install
```

Copy the environment examples before starting the app:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Development

Start MongoDB first:

```bash
npm run db:up
```

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
| CLIENT_URL | http://localhost:5173 | Allowed frontend origin. Supports a comma-separated list of absolute URLs. |
| MONGODB_URI | mongodb://127.0.0.1:27017/ledger-premium-saas | Persistent MongoDB connection string |
| USE_IN_MEMORY_DB | false | Uses mongodb-memory-server for local development |
| JWT_SECRET | development-super-secret-key | JWT signing secret |
| JWT_EXPIRES_IN | 7d | JWT expiration |
| FIREBASE_PROJECT_ID | - | Firebase project id used to validate ID tokens against Google's public signing keys |
| CLOUDINARY_CLOUD_NAME | - | Cloudinary cloud name |
| CLOUDINARY_API_KEY | - | Cloudinary API key |
| CLOUDINARY_API_SECRET | - | Cloudinary API secret |
| ADMIN_EMAILS | - | Comma-separated list of admin emails |

## Frontend Environment Variables

The frontend reads its public configuration from [frontend/src/vite-env.d.ts](frontend/src/vite-env.d.ts).

| Variable | Default | Description |
| --- | --- | --- |
| VITE_API_URL | http://localhost:4000/api | Base URL for the Express API |
| VITE_FIREBASE_API_KEY | - | Firebase web app API key |
| VITE_FIREBASE_AUTH_DOMAIN | - | Firebase auth domain |
| VITE_FIREBASE_PROJECT_ID | - | Firebase project id |
| VITE_FIREBASE_APP_ID | - | Firebase web app id |
| VITE_FIREBASE_MESSAGING_SENDER_ID | - | Firebase sender id |

## Running Without Local MongoDB

For local development only, you can start the backend with an ephemeral in-memory MongoDB instance:

```bash
USE_IN_MEMORY_DB=true MONGOMS_VERSION=7.0.14 npm run dev --workspace backend
```

Important: data stored in memory is lost when the server stops.

## Firebase Setup

Firebase authentication is responsible for identity. The Express API verifies the Firebase ID token with Google's public signing keys, creates the application session cookies and stores the corresponding user record in MongoDB.

1. Create a Firebase project and enable the Email/Password provider in Authentication.
2. Create a Firebase web app and copy its config values into frontend/.env.
3. Set FIREBASE_PROJECT_ID in backend/.env.
4. Start MongoDB, then run the app and use the login page to sign in or create an account.

Important: the authentication email is treated as the account identity and is not editable from the profile screen.

## Render Deployment

The repository includes a blueprint file for a single Render web service that builds the frontend and serves it from the Express backend. This avoids cross-origin configuration and gives the app a single public URL.

What you still need on Render:

- A hosted MongoDB connection string in MONGODB_URI, typically from MongoDB Atlas or another MongoDB provider.
- The final public frontend URL in CLIENT_URL. You can provide multiple domains as a comma-separated list, for example your onrender.com URL and a custom domain.
- Optional Cloudinary variables if you need avatar uploads in production.

Deploy flow:

1. Push the repository to GitHub.
2. Create a new Blueprint on Render from the repository root.
3. Provide CLIENT_URL and MONGODB_URI when Render prompts for them.
4. Deploy. The app will be available from the Render web service URL.

The blueprint sets VITE_API_URL to /api so the frontend and backend stay on the same Render origin.

## Scripts

Root:

```bash
npm run db:up
npm run db:down
npm run db:logs
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

## Notes

- The frontend API base URL defaults to http://localhost:4000/api in development and /api in production.
- Only FIREBASE_PROJECT_ID is required on the backend for Firebase login to work.
- Cloudinary variables are optional unless avatar upload is required.