# Rizz‑A‑Lot

A full‑stack dating app MVP featuring swipes/matches, profiles, realtime chat with reactions, daily prompts, and image uploads. Built with React + Vite (frontend), Node.js/Express (backend), MongoDB (Mongoose), JWT auth, Multer uploads, and Socket.io.

## What this system is

Rizz‑A‑Lot is a minimal yet complete dating app stack you can run locally or deploy:

- Account creation and login with JWT
- Edit profile: name, age (18+ enforced), bio, interests, photo
- Discover and swipe: like or skip suggested users
- Automatic matches when two users like each other
- Realtime chat for matched users (Socket.io) with simple reactions
- Daily prompt questions and answers
- Image upload and serving; works locally and in the cloud

It’s organized as a two‑package monorepo:

- `backend/` – Express REST API, MongoDB models, JWT auth, Multer uploads, Socket.io gateway
- `frontend/` – React + Vite SPA using Tailwind CSS and a small component library

## Architecture overview

- Frontend (Vite on port 5173) calls the API at `${VITE_API_BASE_URL}/api`, defaults to `http://localhost:5000/api` in dev.
- Backend (Express on port 5000) exposes routes under `/api/*` and serves uploaded images at `/uploads/*`.
- Socket.io runs on the backend HTTP server; the client authenticates using the same JWT.
- MongoDB (Atlas or local) stores users, matches, and messages.
- Optional cloud image storage via Cloudinary for deployments without persistent disks.

```
React (Vite)  ↔  Express API  ↔  MongoDB
			│             │
			└── Socket.io ┘
			│
	 Image uploads (local uploads/ or Cloudinary)
```

## Prerequisites

- Node.js 18.18+ (LTS recommended)
- A MongoDB connection string (Atlas or local)
- Windows PowerShell (this README uses PowerShell‑friendly commands)

## Quick start (local dev)

1) Clone and install dependencies

```powershell
# From the repo root
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

2) Create environment files

```powershell
# Backend
Copy-Item backend/.env.example backend/.env

# Frontend
Copy-Item frontend/.env.example frontend/.env
```

3) Configure env values

- Edit `backend/.env` and set:
	- `MONGODB_URI` (or `MONGO_URI`) – your MongoDB URL
	- `JWT_SECRET` – any strong random string
	- `CLIENT_ORIGIN` – `http://localhost:5173` for local dev
	- Optional: `PORT` (defaults to 5000), `UPLOADS_DIR`, `DB_NAME`
- Edit `frontend/.env` and set:
	- `VITE_API_BASE_URL=http://localhost:5000`
	- `VITE_SOCKET_URL=http://localhost:5000`

4) Run the servers (two terminals)

```powershell
# Terminal A (API)
cd backend
npm run dev

# Terminal B (Web)
cd frontend
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173

## How to use the app

1) Register a user via the UI (email + password + basic profile). A profile photo can be uploaded.
2) Log in; a JWT is stored in localStorage and used for API and Socket.io calls.
3) Update your profile: add bio, interests, and set a photo.
4) Discover people on the Discover page; like or skip.
5) When two users like each other, a match is created and appears in Matches.
6) Chat with your matches in realtime; send messages and simple reactions.
7) Answer the daily prompt to enrich your profile.

## Deployment

### Backend on Render

- `render.yaml` is included. It sets up a Node web service using `backend/` with a 1 GB persistent disk mounted at `/var/data`.
- In Render Dashboard, set env vars:
	- `MONGODB_URI`
	- `JWT_SECRET`
	- `CLIENT_ORIGIN=https://<your-frontend-domain>`
	- Optional: `UPLOADS_DIR=/var/data/uploads` (the folder will be created automatically)

### Frontend on Vercel/Netlify

- Build as a static site (Vite): set env vars
	- `VITE_API_BASE_URL=https://<your-backend-domain>`
	- `VITE_SOCKET_URL=https://<your-backend-domain>`

Ensure CORS allows your frontend domain (`CLIENT_ORIGIN`) and that your Socket.io server uses the same origin in `initSocket`.

