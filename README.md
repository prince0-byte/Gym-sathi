# GymSathi — Full Stack SaaS

Complete gym management SaaS platform. Multi-tenant, cloud-hosted, WhatsApp-integrated.

## Structure
```
gymsathi/
├── gymsathi-api/     FastAPI backend (Python)
└── gymsathi-web/     Next.js frontend (TypeScript)
```

## Quick Start (Local)

### Backend
```bash
cd gymsathi-api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL, SECRET_KEY, etc.
alembic upgrade head
python scripts/create_admin.py
uvicorn app.main:app --reload
# API → http://localhost:8000
# Docs → http://localhost:8000/docs
```

### Frontend
```bash
cd gymsathi-web
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
# App → http://localhost:3000
```

## Deployment
- **Backend**  → Render (free tier) — `render.yaml` included
- **Frontend** → Vercel (free tier) — `vercel.json` included
- **Database** → Neon PostgreSQL (free tier)

See `gymsathi-api/DEPLOYMENT_GUIDE.md` for full step-by-step instructions.

## Tech Stack
| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind  |
| Backend    | FastAPI, Python 3.12              |
| Database   | PostgreSQL (Neon), SQLAlchemy     |
| Auth       | JWT (access + refresh tokens)     |
| WhatsApp   | Gupshup API                       |
| Scheduler  | APScheduler (daily jobs at 9AM)   |
| Deploy     | Vercel + Render + Neon (all free) |
