# PostgreSQL, authentication and realtime runbook

## Source of truth

PostgreSQL is the source of truth for authentication and the shared workspace.
The migration `21842b040a52_auth_workspace_realtime_schema.py` creates the
tables and `20260918_0002_realtime_scope_version_key.py` scopes event versions
per workspace:

| Area | Tables |
|---|---|
| Identity | `users`, `auth_sessions` |
| Lab | `labs`, `canonical_tasks` |
| Group | `groups`, `group_members`, `skill_profiles` |
| Assignment | `assignment_drafts`, `assignment_items`, `approved_plans` |
| Execution | `task_progress`, `help_requests`, `help_replies` |
| Realtime recovery | `realtime_events` |

Group mutations are exposed through `PATCH /groups/{id}`, `DELETE /groups/{id}`
and `DELETE /groups/{id}/members/{user_id}` (or `/members/me`). Only the group
leader can rename/delete the group or remove a member; deleting a group cascades
its invitations, profiles, drafts, plans, progress and help requests. The UI
requires a second confirmation click before deletion, then allows the leader to
create a replacement group.

The browser only receives an opaque `HttpOnly` session cookie. The database stores
the SHA-256 hash of that token, never the raw token. Passwords are stored as
PBKDF2-SHA256 hashes. Roles and class scope are always loaded by the backend and
are never accepted from a login payload.

## Local setup

From `codebase/backend`:

```powershell
Copy-Item .env.example .env
docker compose up -d db
python -m alembic upgrade head

# Choose a local-only password; do not commit it.
$env:SEED_DEMO_PASSWORD = "<local-demo-password>"
python -m scripts.seed_demo --with-group

python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8000
```

The seed is idempotent and creates the canonical 23-task Lab manifest, five demo
accounts and, with `--with-group`, the Sloppers group. Login identifiers are:

- `leader.demo@vlearn.local`
- `member.demo@vlearn.local`
- `duong.demo@vlearn.local`
- `dung.demo@vlearn.local`
- `coach.demo@vlearn.local`

All accounts use the value supplied through `SEED_DEMO_PASSWORD` on their first
creation. Rerunning the seed does not rotate existing password hashes.

## Persistence and broadcast order

Each mutation follows the same boundary:

1. authenticate the cookie and authorize role, membership and class scope;
2. validate the expected entity version when supplied;
3. write domain data and one versioned `realtime_events` row in the same
   transaction;
4. commit the transaction;
5. broadcast the committed event to connected WebSocket sessions.

The WebSocket is read-only for business mutations. On connect or reconnect it
sends an authoritative snapshot. A client can send `resume` with
`lastOccurredAt` to replay committed events after that timestamp. The frontend
deduplicates by `event_id` and rejects entity versions older than or equal to
the latest version it has already applied.

## Deployment checklist

- Set a non-default PostgreSQL password and a production `DATABASE_URL`.
- Run `python -m alembic upgrade head` once before starting the application.
- Set `SESSION_COOKIE_SECURE=true` behind HTTPS and keep `HttpOnly` enabled.
- Restrict `APP_CORS_ORIGINS` to the exact production frontend origin.
- Do not set or run `SEED_DEMO_PASSWORD` in production.
- Use one API worker with the current in-process live hub. Before horizontal
  scaling, add a shared event fan-out such as PostgreSQL LISTEN/NOTIFY or Redis;
  the persisted event table already provides replay and recovery.
- Back up both PostgreSQL and the Alembic revision table before production
  migrations.

## Verification

```powershell
python -m ruff check src/api src/core/security.py src/infrastructure/database `
  src/models/auth.py src/services/auth.py src/services/assignment_workflow.py `
  src/services/coach.py src/services/realtime.py src/services/workspace.py `
  tests/integration/test_auth_workspace_realtime.py scripts migrations
python -m pytest -q
```

Frontend verification from `codebase/frontend`:

```powershell
npm test -- --run
npm run build
```

See `validation/realtime-acceptance.md` for the three-session acceptance
scenario and browser-environment limitation.
