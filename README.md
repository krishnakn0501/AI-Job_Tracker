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

## Architecture

This project uses a Domain-Driven Design (DDD) layered architecture:

- **Domain Layer** (`src/domains/`): Pure business logic in entities and value objects
- **Application Layer** (`src/application/`): Use cases and repository interfaces
- **Infrastructure Layer** (`src/infrastructure/`): Prisma repositories, external APIs, auth services
- **Interface Layer** (`src/app/`, `src/components/`): Next.js routes, pages, and UI components
- **Shared Kernel** (`src/shared/`): `Result<T,E>`, domain errors, utilities

See [`docs/architecture-ddd.md`](docs/architecture-ddd.md) for the full architecture guide and [`docs/migration-summary.md`](docs/migration-summary.md) for the DDD refactoring inventory.

### Authentication & middleware

- `src/middleware.ts` checks for the `jobtrack_session` cookie on protected routes and redirects unauthenticated page requests to `/login`.
- API routes use `src/shared/middleware/getUserId.ts`, which reads the session cookie via `cookies()` from `next/headers` and verifies the JWT. Using `cookies()` automatically opts the route into dynamic rendering, avoiding `DYNAMIC_SERVER_USAGE` errors at build time.
- Public auth routes (`/api/auth/*`) and public pages (`/login`, `/signup`, etc.) bypass the cookie check.

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
| Unit/Integration tests | Vitest |
| E2E tests | Playwright |

## Development workflow

```bash
# Start development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Browse the database
npx prisma studio

# Type check
npx tsc --noEmit

# Production build
npm run build
```

## Testing

| Test Type | Command | Description |
|-----------|---------|-------------|
| Unit | `npm run test:unit:run` | Vitest unit tests for domain logic |
| Unit (watch) | `npm run test:unit` | Vitest in watch mode |
| Integration | `npm run test:integration` | Vitest integration tests (database required) |
| E2E | `npm run test:e2e` | Playwright E2E tests (requires dev server) |
| E2E (UI) | `npm run test:e2e:ui` | Playwright UI mode |

### Unit tests

Unit tests live alongside the code they test, mirroring the `src/` structure:

```
tests/unit/domains/user/Email.spec.ts
tests/unit/domains/user/Password.spec.ts
tests/unit/domains/user/User.spec.ts
tests/unit/domains/application/Application.spec.ts
tests/unit/domains/application/ApplicationStatus.spec.ts
tests/unit/domains/resume/Resume.spec.ts
tests/unit/shared/Result.spec.ts
tests/unit/shared/errors/DomainError.spec.ts
tests/unit/shared/utils/cn.spec.ts
```

**Principles:**
- Test pure business logic in domain entities and value objects.
- Avoid I/O, database, and external API calls.
- Use Vitest's built-in `describe`, `it`, and `expect`.

### Integration tests

Integration tests verify that the infrastructure and application layers work together:

```
tests/integration/persistence/    # Repository implementations
tests/integration/services/         # Use-case composition
tests/integration/external-api/     # External API clients
```

**Principles:**
- Integration tests may hit a real test database.
- Run repository tests against a throwaway schema or isolated test database.
- Keep tests independent and clean up state in `afterEach`/`afterAll`.

## Sprint structure

Built in sprints (S0–S9). See `.claude/sprints/` for detailed specs and the SDDD refactoring overview. Use `/start-sprint S{N}` in Claude Code to start any sprint session.

## Contributing

### Getting started

See the main README above for setup instructions.

### Code style

- TypeScript **strict mode** is enabled.
- Use the path aliases defined in `tsconfig.json` (e.g., `@/domains/*`, `@/shared/*`).
- Format code with Prettier and follow the existing ESLint rules.

### Commit conventions

We use conventional commit messages:

```
refactor(D): phase-X-description - brief description
feat: add new feature
fix: fix bug
docs: update documentation
test: add or modify tests
chore: maintenance tasks
```

### Architecture

This project follows a Domain-Driven Design (DDD) layered architecture. Read [`docs/architecture-ddd.md`](docs/architecture-ddd.md) before making changes.

### Layer boundaries

- **`src/domains/`** — Pure business logic (entities, value objects, domain rules). No framework or DB dependencies.
- **`src/application/`** — Use cases, repository interfaces, and DTOs.
- **`src/infrastructure/`** — Concrete implementations (Prisma repositories, external APIs, auth, email).
- **`src/app/` / `src/components/`** — Next.js routes, pages, and UI components. Keep these thin.
- **`src/shared/`** — Shared kernel used by all layers (`Result<T,E>`, domain errors, utilities).

### Feature checklist

When adding a new feature:

- [ ] Domain entity created in `src/domains/<feature>/entities/`
- [ ] Value objects defined in `src/domains/<feature>/value-objects/` if needed
- [ ] Repository interface declared in `src/application/interfaces/`
- [ ] Use case implemented in `src/application/services/`
- [ ] Repository implementation added to `src/infrastructure/persistence/prisma/repositories/`
- [ ] Data mapper created in `src/infrastructure/persistence/prisma/mappers/` if needed
- [ ] Container wiring updated in `src/infrastructure/container.ts`
- [ ] API route created in `src/app/api/<feature>/route.ts`
- [ ] UI components built in `src/components/features/<feature>/`
- [ ] Unit tests written in `tests/unit/domains/<feature>/`
- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] Production build passes: `npm run build`

### Do and don't

#### ✅ Do

- Keep Prisma client **only** in the infrastructure layer.
- Use `Result<T,E>` for expected failures in application/use-case code.
- Throw domain errors (`ValidationError`, `NotFoundError`, etc.) for exceptional cases.
- Wire dependencies through `src/infrastructure/container.ts`.
- Write unit tests for domain entities and value objects.

#### ❌ Don't

- Import `@prisma/client` in `src/domains/` or `src/application/`.
- Put business logic in API routes or UI components.
- Bypass the repository pattern with direct database calls.
- Mix concerns across layers.

### Pull request process

1. Create a feature branch from `main`.
2. Make changes following the architecture guidelines.
3. Add or update tests.
4. Run `npx tsc --noEmit`, `npm run test:unit:run`, and `npm run build` locally.
5. Submit a PR with a clear description.
6. Address review feedback and merge.


