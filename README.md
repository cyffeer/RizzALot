# Rizz-A-Lot (MVP)

Full-stack dating app MVP with React (frontend), Node/Express (backend), MongoDB (Mongoose), JWT auth, image uploads, and Socket.io chat.

## Structure

- `backend/` – Express API, MongoDB models, JWT auth, Multer uploads, Socket.io.
- `frontend/` – React + Vite app with pages for auth, profile, discover, matches, and chat.
- `server/` – Existing folder (not used by this setup). Safe to ignore or remove later.

## Backend

1. Copy backend env example and adjust:

```bash
cp backend/.env.example backend/.env
```

Update values as needed (Windows users can create the `.env` file manually).

2. Install and run backend:

```bash
cd backend
npm install
npm run dev
```

API runs at http://localhost:5000

## Frontend

1. Copy frontend env example and adjust:

```bash
cp frontend/.env.example frontend/.env
```

2. Install and run frontend:

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173

### UI & Tailwind CSS

The frontend uses Tailwind CSS for styling with a small set of reusable components:

- `src/components/Layout.jsx` – page shell with navbar and footer
- `src/components/Button.jsx` – primary/secondary/outline/ghost variants
- `src/components/Input.jsx` – labeled inputs and text areas
- `src/components/Card.jsx` – card wrapper with header/body/footer helpers
- `src/components/Avatar.jsx` – circular avatar with initials fallback
- `src/components/Badge.jsx` – small pill badge used for tags/chips
- `src/components/ChatBubble.jsx` – message bubble with reaction summary

Global styles and Tailwind utilities live in `src/index.css`. Tailwind is configured through `tailwind.config.js` and `postcss.config.js`.

Pages are refactored to use these components for a consistent, responsive design:

- Discover has profile cards, intent filters, and a daily prompt banner.
- Matches shows a clean list with avatars.
- Chat includes message bubbles, starter chips, and reaction buttons.
- Profile separates basic info and interests into cards with selectable chips.
- Questions uses chips for multi-select fields and a tidy layout.

## API Summary

- Auth: `POST /api/auth/register` (multipart: name,email,password,age,bio,photo), `POST /api/auth/login`, `GET /api/auth/me`
- Users: `GET /api/users/me`, `PUT /api/users/me` (multipart), `GET /api/users/discover`, `POST /api/users/like/:id`, `POST /api/users/skip/:id`
- Matches: `GET /api/matches`
- Messages: `GET /api/messages/:matchId`, `POST /api/messages/:matchId`

All endpoints (except `register` and `login`) require `Authorization: Bearer <token>` header.

## Notes

- Images are stored in `backend/uploads` and served at `/uploads/<file>`.
- Socket.io connects using the JWT token; clients must join a match room before sending messages.
- Minimum age enforced at 18.

## Next steps

- Add pagination to matches and messages.
- Improve validation and error messages.
- Add typing indicators and online presence in chat.
- Deploy with environment-specific configs.
