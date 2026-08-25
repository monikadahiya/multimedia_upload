# MediaVault

A full-stack multimedia library: upload images, videos, audio, and PDFs; preview them inline; search by name/tag; and get results ranked by relevance (keyword match + view count + recency).

**Stack:** React (Hooks + Redux Toolkit) · Node.js/Express · MongoDB Atlas · Cloudinary · JWT auth

```
mediavault/
├── backend/     Express API (auth, uploads, search, Swagger docs)
├── frontend/    React SPA (Redux store, protected routes, upload/search UI)
└── postman_collection.json
```

## Features

- **Auth**: register/login with bcrypt-hashed passwords, short-lived JWT access tokens + rotating refresh tokens, delivered as HTTP-only cookies (with a Bearer-token fallback for API clients).
- **Upload**: drag/click-to-upload for image, video, audio, PDF, streamed straight to Cloudinary; metadata (URL, type, size, tags) stored in MongoDB. Server-side file-type and 50MB size limits.
- **Preview**: type-appropriate inline preview (`<img>`, `<video>`, `<audio>`, `<iframe>` for PDFs) served directly from Cloudinary URLs.
- **Search & ranking**: MongoDB text index across file name/tags/description, blended with a relevance score that also weighs view count (log-scaled) and upload recency (exponential decay). Sort presets: Best match / Most viewed / Newest.
- **Errors**: centralized Express error handler returns consistent JSON for validation errors, auth failures, bad file types, oversized files, and 404s.
- **Docs**: Swagger UI at `/api/docs`, raw OpenAPI JSON at `/api/docs.json`, plus a Postman collection.
- **Tests**: Jest + Supertest (backend, in-memory MongoDB) and Jest + React Testing Library (frontend).

## Prerequisites

- Node.js 18+
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (or local MongoDB for dev)
- A free [Cloudinary](https://cloudinary.com/users/register/free) account

## Run locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT secrets, Cloudinary keys
npm run dev             # http://localhost:5000
```

Swagger docs: `http://localhost:5000/api/docs`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # REACT_APP_API_URL=http://localhost:5000/api
npm start                # http://localhost:3000
```

### 3. Tests

```bash
cd backend && npm test    # Jest + Supertest, spins up an in-memory MongoDB
cd frontend && npm test   # Jest + React Testing Library
```

## Environment variables

**backend/.env**

| Variable                                                                 | Description                                 |
| ------------------------------------------------------------------------ | ------------------------------------------- |
| `MONGO_URI`                                                              | MongoDB Atlas connection string             |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`                               | Long random strings, keep secret            |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES`                             | Token lifetimes (default `15m` / `7d`)      |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard              |
| `CLIENT_URL`                                                             | Frontend origin, for CORS + cookie settings |

**frontend/.env**

| Variable            | Description                                        |
| ------------------- | -------------------------------------------------- |
| `REACT_APP_API_URL` | Backend base URL, e.g. `http://localhost:5000/api` |

## API overview

Full interactive spec at `/api/docs`. Summary:

| Method | Route                                              | Auth           | Description                                         |
| ------ | -------------------------------------------------- | -------------- | --------------------------------------------------- |
| POST   | `/api/auth/register`                               | –              | Create an account                                   |
| POST   | `/api/auth/login`                                  | –              | Log in                                              |
| POST   | `/api/auth/refresh`                                | refresh cookie | Rotate access token                                 |
| POST   | `/api/auth/logout`                                 | –              | Invalidate refresh token                            |
| GET    | `/api/auth/me`                                     | ✓              | Current user                                        |
| POST   | `/api/files/upload`                                | ✓              | Upload a file (`multipart/form-data`, field `file`) |
| GET    | `/api/files`                                       | ✓              | List your files, paginated                          |
| GET    | `/api/files/search?query=&fileType=&sortBy=&page=` | ✓              | Ranked keyword search                               |
| GET    | `/api/files/:id`                                   | ✓              | Get one file (increments view count)                |
| DELETE | `/api/files/:id`                                   | ✓              | Delete a file                                       |

Import `postman_collection.json` into Postman to try these directly.

## How ranking works

`backend/utils/relevanceScore.js` combines three normalized signals into one score:

- **Text relevance** — MongoDB's `$text` score from a weighted index (file name > tags > description)
- **Popularity** — `log10(viewCount + 1)`, so early view spikes don't overwhelm a strong keyword match
- **Recency** — exponential decay from upload date

Weights are adjustable per-request via `sortBy=relevance|popularity|date`.

## Security notes

- Passwords hashed with bcrypt (12 salt rounds)
- Access tokens short-lived (15 min); refresh tokens rotated and capped at 5 concurrent sessions per user
- Cookies set `httpOnly`, and `secure`/`SameSite=None` in production
- `helmet`, CORS locked to `CLIENT_URL`, and rate limiting on auth endpoints
- Server-side MIME-type allowlist and 50MB upload size limit (in addition to client-side checks)
- All file routes scoped to `req.user.id` — no cross-user access to metadata or deletion

## Deployment

The fastest free path is **Vercel** (frontend) + **Railway or Render** (backend), both of which read `PORT` from the environment automatically.

1. Push this repo to your own GitHub account.
2. **Backend → Railway/Render**: create a new service from the `backend/` folder, add the env vars from the table above, deploy. Note the resulting URL (e.g. `https://mediavault-api.up.railway.app`).
3. **Frontend → Vercel**: import the repo, set the root directory to `frontend/`, add `REACT_APP_API_URL=https://<your-backend-url>/api`, deploy.
4. Back in the backend service, set `CLIENT_URL` to your new Vercel URL and redeploy so CORS/cookies allow it.
5. Add your live frontend URL here.


