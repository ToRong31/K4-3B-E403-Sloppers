# Auth, persistence and realtime acceptance log

Date: 2026-09-18

Recorded results:

- backend: `96 passed, 4 xfailed`;
- focused auth/workspace/realtime suite: `5 passed`;
- changed backend files: Ruff passed;
- frontend: `11` test files, `30` tests passed;
- frontend production build: passed;
- PostgreSQL Alembic head: `20260918_0002`;
- seeded database: `5` users, `23` canonical tasks, `1` group.
- UI smoke: Leader opened the persisted Sloppers workspace and the CRUD dialog
  listed rename, pending-invitation cancellation, member removal and group
  deletion controls.

## Automated three-session acceptance

Test: `codebase/backend/tests/integration/test_auth_workspace_realtime.py`

Three independent clients use separate cookie jars and authenticated WebSocket
connections for Leader, Member and Coach. The scenario verifies this ordered
flow:

1. Member accepts an invitation.
2. Member saves a self-declared skill profile.
3. Leader generates a group-scoped assignment draft.
4. Leader approves the draft.
5. Assigned Member marks the task done with an expected version.
6. Member creates a Coach support request.
7. Coach replies and resolves the request.
8. All three sockets receive each committed event.
9. After disconnect, a fresh HTTP snapshot still contains the approved plan and
   completed task.
10. The Coach dashboard reports aggregate progress and does not expose member
    skill profiles.
11. A leader renames a group, cancels a pending invitation, deletes the group,
    confirms the workspace disappears, then creates a replacement group.

Additional acceptance cases verify:

- anonymous requests are rejected;
- backend roles override any client assumption;
- logout revokes the persisted session;
- a member cannot mutate task progress before plan approval;
- an older assignment draft cannot be approved after a newer version exists;
- group update/delete/member-removal operations are leader-only and persisted;
- reconnect returns an authoritative persisted snapshot.

## Reconnect, dedupe and version acceptance

Frontend test: `codebase/frontend/src/realtime/webSocketClient.test.js`

- duplicate `event_id` values are delivered once;
- stale or repeated entity versions are ignored;
- reconnect uses exponential backoff with jitter;
- reconnect sends `resync` with the last committed event timestamp.

Backend WebSocket acceptance verifies that snapshots and events are authorized
from the session cookie and that client-originated business mutations are
rejected as read-only.

## Browser smoke test

The local UI was opened at `http://127.0.0.1:5173` in the Codex in-app browser.
Login with the seeded Leader account succeeded through the PostgreSQL-backed
session endpoint, redirected to the Lab list, and the LabSpace page loaded the
Sloppers group and persisted task catalog.

The host exposed only one in-app browser provider and no independent Chrome or
Edge profiles. Therefore a genuine simultaneous Chrome/Edge/Firefox acceptance
run could not be produced in this environment. The three independent session
and socket behavior is covered automatically above; a manual cross-browser run
remains the final deployment-environment check.

Suggested manual matrix:

| Browser/profile | Account | Expected evidence |
|---|---|---|
| Chrome profile A | Leader | sees invitation/profile/task events without reload |
| Edge profile B | Member | reconnect restores snapshot; duplicate event is absent |
| Firefox/profile C | Coach | sees aggregate progress and help request, never raw skills |
