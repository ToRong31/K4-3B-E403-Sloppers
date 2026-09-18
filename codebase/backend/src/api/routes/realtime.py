import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from src.infrastructure.json_store import get_json_store

router = APIRouter(tags=["realtime"])


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict[str, Any], exclude: WebSocket | None = None) -> None:
        dead_connections = []
        for connection in self.active_connections:
            if exclude is not None and connection is exclude:
                continue
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()


def create_realtime_envelope(
    event_type: str,
    payload: dict[str, Any],
    scope_id: str = "group-sloppers",
) -> dict[str, Any]:
    return {
        "event_id": str(uuid4()),
        "type": event_type,
        "scope_id": scope_id,
        "version": 1,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    }


@router.websocket("/realtime")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    store = get_json_store()
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except Exception:
                continue

            event_type = data.get("type", "chat.message_sent")
            payload = data.get("payload") or data
            scope_id = data.get("scope_id", "group-sloppers")

            # Persist according to event type
            if event_type == "chat.message_sent":
                saved_msg = store.add_group_chat_message(payload)
                envelope = create_realtime_envelope("chat.message_sent", saved_msg, scope_id)
                # Broadcast only to other connections, sender already has optimistic bubble
                await manager.broadcast(envelope, exclude=websocket)
            elif event_type == "task.updated":
                task_id = payload.get("id")
                if task_id:
                    store.update_task(task_id, payload)
                envelope = create_realtime_envelope("task.updated", payload, scope_id)
                await manager.broadcast(envelope)
            elif event_type == "plan.approved":
                store.approve_plan()
                envelope = create_realtime_envelope("plan.approved", payload, scope_id)
                await manager.broadcast(envelope)
            elif event_type == "help_request.created":
                saved_req = store.add_support_request(
                    group_id=payload.get("groupId", "group-sloppers"),
                    group_name=payload.get("groupName", "Sloppers"),
                    student_name=payload.get("studentName", "Học viên"),
                    question=payload.get("question", ""),
                    task_title=payload.get("taskTitle"),
                )
                envelope = create_realtime_envelope("help_request.created", saved_req, scope_id)
                await manager.broadcast(envelope)
            else:
                envelope = create_realtime_envelope(event_type, payload, scope_id)
                await manager.broadcast(envelope)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


class GroupChatMessageInput(BaseModel):
    id: str | None = None
    senderId: str | None = None
    senderCode: str | None = None
    author: str
    shortName: str | None = None
    initial: str | None = None
    role: str | None = None
    isLeader: bool = False
    time: str | None = None
    text: str
    groupId: str = "group-sloppers"


@router.get("/groups/current/chat")
def get_group_chat_history(group_id: str = "group-sloppers") -> list[dict[str, Any]]:
    store = get_json_store()
    return store.get_group_chat_messages(group_id)


@router.post("/groups/current/chat")
async def post_group_chat_message(payload: GroupChatMessageInput) -> dict[str, Any]:
    store = get_json_store()
    msg_dict = payload.model_dump(exclude_none=True)
    msg_dict.pop("mine", None)
    if "initial" not in msg_dict:
        msg_dict["initial"] = (payload.shortName or payload.author)[0].upper()
    if "time" not in msg_dict:
        msg_dict["time"] = datetime.now(timezone.utc).strftime("%H:%M")
    saved = store.add_group_chat_message(msg_dict)
    envelope = create_realtime_envelope("chat.message_sent", saved, payload.groupId)
    await manager.broadcast(envelope)
    return saved
