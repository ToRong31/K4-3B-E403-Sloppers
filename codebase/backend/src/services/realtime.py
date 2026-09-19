import json
from dataclasses import dataclass
from uuid import UUID

from fastapi import WebSocket


@dataclass(frozen=True)
class ConnectionContext:
    user_id: UUID
    role: str
    class_scope_id: str
    group_ids: frozenset[str]


class RealtimeHub:
    def __init__(self) -> None:
        self.connections: dict[WebSocket, ConnectionContext] = {}

    async def connect(self, websocket: WebSocket, context: ConnectionContext) -> None:
        await websocket.accept()
        self.connections[websocket] = context

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.pop(websocket, None)

    async def send(self, websocket: WebSocket, message: dict) -> None:
        await websocket.send_text(json.dumps(message, ensure_ascii=False))

    async def broadcast(self, event: dict) -> None:
        dead: list[WebSocket] = []
        scope_id = str(event["scope_id"])
        for websocket, context in list(self.connections.items()):
            allowed = (
                scope_id == str(context.user_id)
                or scope_id in context.group_ids
                or event.get("actor", {}).get("id") == str(context.user_id)
                or (
                    context.role == "coach"
                    and event.get("class_scope_id") == context.class_scope_id
                )
            )
            if not allowed:
                continue
            try:
                await self.send(websocket, event)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(websocket)


realtime_hub = RealtimeHub()
