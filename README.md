# JobTrack

An AI-powered job application tracker. Paste a job description — Claude tailors your resume in under 45 seconds and saves it as a downloadable .docx. Track all applications, statuses, and follow-ups in one dashboard.

## Quick start

**Prerequisites**: Node.js 18+, Docker Desktop

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL, ANTHROPIC_API_KEY, N8N_API_KEY, NEXT_PUBLIC_APP_URL, USER_EMAIL

# 3. Run DB migration
npx prisma migrate dev --name init

# 4. Start the app
npm run dev
# → Open localhost:3000
```

**One-time setup:**
- Go to `/upload-resume` and upload your PDF resume (Claude extracts it)
- In a second terminal: `docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n`
- Open localhost:5678, import `n8n_workflow.json`, add credentials, activate both workflows
- Copy the webhook URL into `.env.local` as `N8N_WEBHOOK_URL`, restart the app

## Daily use

1. Go to `/add` — fill in company, role, paste the job description
2. Click "Generate tailored resume →" — resume appears in ~30 seconds
3. Download the `.docx` from the dashboard
4. Check the daily 9am email for follow-up reminders

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon.tech free tier) |
| ORM | Prisma 5 |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| .docx | `docx` npm package |
| Automation | n8n (self-hosted Docker) |
| Email | Gmail SMTP via n8n |

## Sprint structure

Built in 7 sessions (S0–S6). See `.claude/specs/` for detailed specs per sprint.
Use `/start-sprint S{N}` in Claude Code to start any sprint session.
