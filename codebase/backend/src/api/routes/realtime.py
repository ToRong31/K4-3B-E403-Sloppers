import json
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from src.infrastructure.database.repositories import AuthRepository, WorkspaceRepository
from src.services.auth import AuthService, InvalidSessionError
from src.services.realtime import ConnectionContext, realtime_hub
from src.services.workspace import DomainError, WorkspaceService, event_envelope

router = APIRouter(tags=["realtime"])


@router.websocket("/realtime")
async def websocket_endpoint(websocket: WebSocket) -> None:
    settings = websocket.app.state.settings
    token = websocket.cookies.get(settings.session_cookie_name)
    session_factory = websocket.app.state.db_session_factory
    with session_factory() as session:
        auth = AuthService(AuthRepository(session), settings.session_ttl_hours)
        try:
            user = auth.authenticate(token).user
        except InvalidSessionError:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason="Authentication required"
            )
            return
        repo = WorkspaceRepository(session)
        if user.role == "coach":
            groups = repo.list_class_groups(user.class_scope_id)
            group_ids = frozenset(str(group.id) for group in groups)
            snapshot = {
                "source": "postgres",
                "summary": {"activeGroups": len(groups)},
                "groups": [
                    {
                        "id": str(group.id),
                        "name": group.name,
                        "code": group.code,
                        "version": group.version,
                    }
                    for group in groups
                ],
            }
        else:
            group = repo.get_group_for_user(user.id)
            group_ids = frozenset({str(group.id)}) if group else frozenset()
            try:
                snapshot = WorkspaceService(repo).snapshot(user) if group else None
            except DomainError:
                snapshot = None
        context = ConnectionContext(
            user_id=user.id, role=user.role, class_scope_id=user.class_scope_id, group_ids=group_ids
        )
        await realtime_hub.connect(websocket, context)
        await realtime_hub.send(
            websocket,
            {
                "event_id": f"snapshot:{uuid4()}",
                "type": "snapshot",
                "scope_id": str(user.id),
                "entity_id": str(user.id),
                "version": max(
                    [item.get("version", 0) for item in ([snapshot] if snapshot else [])], default=0
                ),
                "occurred_at": datetime.now().astimezone().isoformat(),
                "actor": {"id": "system", "role": "system"},
                "payload": snapshot,
            },
        )
        try:
            while True:
                raw = await websocket.receive_text()
                try:
                    message = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                message_type = message.get("type")
                if message_type == "ping":
                    await realtime_hub.send(websocket, {"type": "pong"})
                elif message_type in {"resync", "resume"}:
                    after_raw = message.get("after")
                    after = datetime.fromisoformat(after_raw) if after_raw else None
                    for event in repo.events_after(set(group_ids) | {str(user.id)}, after):
                        await realtime_hub.send(websocket, event_envelope(event))
                    if message_type == "resync" and user.role != "coach" and group_ids:
                        await realtime_hub.send(
                            websocket,
                            {
                                "event_id": f"snapshot:{uuid4()}",
                                "type": "snapshot",
                                "scope_id": str(user.id),
                                "entity_id": str(user.id),
                                "version": 0,
                                "occurred_at": datetime.now().astimezone().isoformat(),
                                "actor": {"id": "system", "role": "system"},
                                "payload": WorkspaceService(repo).snapshot(user),
                            },
                        )
                else:
                    await realtime_hub.send(
                        websocket, {"type": "error", "code": "read_only_socket"}
                    )
        except WebSocketDisconnect:
            realtime_hub.disconnect(websocket)
        except Exception:
            realtime_hub.disconnect(websocket)
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
