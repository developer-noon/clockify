# Clockify Time Tracking MVP

Full-stack time tracking app with a React + Vite frontend and a Node.js + Express + TypeScript backend.

## Repository Layout

- `backend/` - API server, database logic, auth, reports, and PDF export
- `frontend/` - React UI, routing, auth state, and shared pages

## Quick Start

Install dependencies separately in each app:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create environment files for your setup:

- Use `backend/.env.example` as the backend template.
- Create `frontend/.env` with your frontend API URL.

Run the apps from their own folders:

```bash
cd backend
npm run dev

cd ../frontend
npm run dev
```

## Notes

- The backend uses MongoDB.
- Keep secrets and local environment files out of Git.
- Commit the generated lockfiles inside `backend/` and `frontend/` so installs stay reproducible.
