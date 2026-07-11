# ProAI

ProAI is a Persian-first, open collaboration platform for creating, discovering, versioning, and improving AI prompts and reusable skills. The interface is fully RTL (`fa-IR`), dark-first, responsive, and built for a developer-focused community workflow.

This repository contains the working MVP foundation. It runs entirely against a local MongoDB Community server by default—MongoDB Atlas or another cloud database is not required.

## What is included

- Email/password authentication with opaque, database-backed sessions
- Public profiles, follows, reputation ranks, achievements, and leaderboards
- Prompt and skill creation with immutable official version histories
- Explore, search, categories, tags, likes, saves, ratings, comments, and forks
- Fork-based improvement requests with private owner/contributor discussion
- Owner decisions: accept, request changes, reject, or close
- Transactional acceptance that creates a new official version and awards reputation
- Persian AI prompt analysis and enhancement with six quality dimensions
- Direct messages with unread counts, typing state, presence, and an HTTP fallback
- Notifications, profile settings, messaging privacy, and validated avatar uploads
- Premium Persian RTL UI using Vazirmatn, Lucide icons, Motion, and Tailwind CSS

## Technology

| Area | Implementation |
| --- | --- |
| Web | Next.js 16 App Router, React 19, TypeScript strict mode |
| UI | Tailwind CSS 4, Motion, Lucide React, Vazirmatn |
| Data | MongoDB Community Edition 8, Mongoose 9 |
| Authentication | bcrypt password hashes, hashed opaque session tokens, HTTP-only cookies |
| Realtime | Socket.IO gateway plus `/api/messages` fallback |
| AI | OpenAI Responses API, Ollama, or local heuristic analysis |
| Validation | Zod at action and provider boundaries |
| Tests | Vitest and Testing Library |

## Prerequisites

- Node.js 20.9 or newer
- npm
- MongoDB Community Server 8 installed locally and running as replica set `rs0`
- MongoDB Compass (optional, for viewing and managing the local database)

The application connects directly to the native MongoDB Windows service on `127.0.0.1:27017`. MongoDB Compass is a database GUI; the MongoDB Server service must also be installed and running. A replica set is required because publishing, social interactions, forks, and accepted improvements use MongoDB transactions.

## Quick start

1. Install dependencies.

   ```powershell
   npm install
   ```

2. Create the local environment file.

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Generate a strong authentication secret and place it in `AUTH_SECRET` inside `.env.local`.

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

4. Confirm the native MongoDB service is running.

   ```powershell
   Get-Service MongoDB
   ```

   Its status should be `Running`. In MongoDB Compass, connect with:

   ```text
   mongodb://127.0.0.1:27017/ai_intelligence_hub?replicaSet=rs0
   ```

5. Seed development data.

   ```powershell
   npm run seed
   ```

6. Start the web application and realtime gateway together.

   ```powershell
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). The realtime health endpoint is available at [http://localhost:3001/health](http://localhost:3001/health).

The seed is idempotent: it upserts stable demo records and reconciles the development indexes without deleting unrelated data.

## Demo accounts

All seeded accounts use `SEED_DEFAULT_PASSWORD`. With the example environment, the password is `ProAI-Dev-1405!`.

| Account | Email | Username |
| --- | --- | --- |
| Prompt and skill owner | `sara@proai.local` | `sara-architect` |
| Fork contributor | `amir@proai.local` | `amir-builder` |
| Research creator | `niloofar@proai.local` | `niloofar-lab` |
| Seeded moderator/admin identity | `team@proai.local` | `proai-team` |

These credentials and privileged demo roles are for local development only. The seed refuses to run when `NODE_ENV` is anything other than `development` unless `ALLOW_NON_DEVELOPMENT_SEED=true` and a unique `SEED_DEFAULT_PASSWORD` of at least 16 characters is supplied. In that exceptional mode, the `proai-team` account remains a normal user unless `SEED_ENABLE_PRIVILEGED_DEMO_USER=true` is also set. The non-development password is never printed.

## Environment variables

The committed `.env.example` documents every setting. The defaults are:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/ai_intelligence_hub?replicaSet=rs0
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_REALTIME_URL=http://localhost:3001
REALTIME_PORT=3001

AI_PROVIDER=disabled
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
```

Keep secrets in `.env.local`; never commit the real `AUTH_SECRET`, provider keys, or production credentials.

The demo seed is intended for local development. Do not enable its non-development safety overrides on a real production database.

### Native MongoDB

The default configuration uses the native local MongoDB service and replica set `rs0`. You can inspect the same database in MongoDB Compass using the documented `MONGODB_URI`. A standalone MongoDB process is not sufficient for transaction-backed mutations.

## AI providers

AI integration is optional. The analyzer always returns a Persian score, dimension breakdown, suggestions, and an enhanced prompt.

### Local fallback

No setup is required. Leave `AI_PROVIDER=disabled` to use the deterministic local heuristic analyzer. If a configured remote provider fails, ProAI falls back to this analyzer automatically.

### OpenAI

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-5.4-mini
```

The implementation uses the Responses API with a Zod-backed structured output schema.

### Ollama

Run Ollama locally, pull the configured model, and set:

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
```

## Realtime messaging

`npm run dev` starts two processes:

- Next.js web server on port `3000`
- Authenticated Socket.IO gateway on port `3001`

The gateway validates the same database session cookie as the web application. It handles conversation rooms, new messages, typing indicators, read state, and online presence. When the gateway is unavailable, the client switches to the `/api/messages` HTTP path; message delivery remains available, while live presence and typing indicators do not.

For a production-style local run, build first and supervise the web and realtime processes separately:

```powershell
npm run build
npm start
```

```powershell
npm run realtime
```

`APP_URL` must match the web origin so credentialed Socket.IO connections pass CORS checks.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the complete web and realtime development stack |
| `npm run dev:web` | Start only the Next.js development server |
| `npm run dev:realtime` | Start only the realtime gateway |
| `npm run dev:all` | Explicit alias for the complete development stack |
| `npm run realtime` | Start the standalone realtime gateway |
| `npm run seed` | Upsert Persian demo content, users, and collaboration data |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Create a production Next.js build |
| `npm start` | Serve the production Next.js build |

## Architecture

```text
app/                    Next.js routes, layouts, error states, and API handlers
  (auth)/               Login and registration experience
  (platform)/           Persian RTL product routes
components/             Shared UI primitives and responsive application shell
features/               Feature-owned actions, data access, validation, and clients
  ai/                   Analyzer providers and structured result schema
  auth/                 Authentication actions and forms
  chat/                 Conversations, HTTP fallback, and Socket.IO client
  content/              Prompt/skill CRUD, versions, forks, and interactions
  improvements/         Review discussions and owner decisions
  social/               Profiles, follows, settings, and notifications
lib/                    Authentication DAL, database connection, env, and utilities
models/                 Mongoose schemas and indexes
realtime/               Authenticated Socket.IO gateway
scripts/                Idempotent local data seed
tests/                  Automated tests
proxy.ts                Optimistic route protection; data boundaries re-authenticate
```

Security-sensitive authorization is performed beside each data mutation, not only in the route proxy. Markdown is sanitized before rendering, sessions can be revoked in the database, and multi-document collaboration workflows use transactions.

## MVP boundaries

- MongoDB is intentionally local-only. Cloud migration is not configured.
- Presence is held in one realtime process; horizontal scaling needs a shared Socket.IO adapter.
- Uploaded avatars are stored under `public/uploads/avatars`; shared deployments need durable object storage.
- Registration currently omits email verification, password reset, and multi-factor authentication.
- Moderation schemas and seeded roles exist, but a complete administration console is outside this MVP.
- The current automated suite is a foundation and should be expanded with browser-level and transaction integration tests before a public launch.

## Verification before handoff

Run the complete local quality gate:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```
