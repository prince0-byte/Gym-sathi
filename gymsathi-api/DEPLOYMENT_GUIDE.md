# GymSathi — Deployment Guide

## Stack: Neon → Render → Vercel  |  Cost: $0

---

## Step 1 — Neon Database
1. Sign up at https://neon.tech
2. New Project → name: gymsathi → region: Singapore
3. Copy connection string → change `postgresql://` to `postgresql+asyncpg://`

Final format:
```
postgresql+asyncpg://user:pass@ep-xxx.neon.tech/gymsathi?sslmode=require
```

---

## Step 2 — Render Backend
1. Push `gymsathi-api` to GitHub
2. Render → New Web Service → connect repo
3. Settings:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Region: Singapore

4. Add env vars (from `.env.example`)
5. After deploy, open Shell tab:
```bash
alembic upgrade head
python scripts/create_admin.py
```

6. Verify: https://gymsathi-api.onrender.com/health

---

## Step 3 — Vercel Frontend
1. Push `gymsathi-web` to GitHub
2. Vercel → Import → add env var:
   - `NEXT_PUBLIC_API_URL` = `https://gymsathi-api.onrender.com`
3. Deploy

---

## Step 4 — Keep Render Warm (Free)
- UptimeRobot → monitor https://gymsathi-api.onrender.com/health every 10 min
- Prevents 30-second cold start

---

## Step 5 — Google Sheet Setup
1. Google Cloud Console → Enable Sheets API + Drive API
2. Create Service Account → download `credentials.json`
3. Upload to Render project root
4. Gym owner shares their sheet with the service account email

---

## Checklist
- [ ] API health endpoint returns healthy
- [ ] Admin login works
- [ ] Can create a gym owner
- [ ] Owner login works
- [ ] Can add a member
- [ ] Reminder engine runs
- [ ] WhatsApp test message sends
