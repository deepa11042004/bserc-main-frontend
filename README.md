# BSERC Next.js Frontend

This project is the Next.js App Router frontend for BSERC. It includes a public site, admin dashboard routes, authentication flows, and server-side API proxies to the backend service.
//testing PP
## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. Install dependencies:
	npm install
2. Create environment variables in .env.local:
	API_URL=http://127.0.0.1:5000
3. Start development server:
	npm run dev

## Scripts

- npm run dev: Start local development server
- npm run build: Create production build
- npm run start: Run production server
- npm run lint: Run ESLint checks
- npm run type-check: Run TypeScript checks

## Main Routes

- Student login: /login
- Student register: /register
- Admin login: /admin/login
- Admin dashboard: /admin

Legacy auth routes are permanently redirected to the canonical routes for compatibility:

- /auth/student/login
- /auth/student/register
- /auth/admin-login/login

## API Proxy Routes

- POST /api/auth/login
- POST /api/auth/register
- POST /api/workshop-list/create

All proxy routes forward requests to API_URL with local fallback hosts for development.

## AWS Docker Deployment Note

For production Docker deployments, `API_URL` must be present in the frontend container runtime environment.

- If backend is another container in the same Docker network:
	- `API_URL=http://auth-backend:5000`
- If backend is exposed on a public domain:
	- `API_URL=https://your-backend-domain.com`

If `API_URL` is missing, frontend API routes like `/api/auth/login` will return `500`.


