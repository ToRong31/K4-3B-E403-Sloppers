from fastapi.testclient import TestClient

from src.api.deps import get_assignment_graph
from src.api.main import create_app
from src.core.config import Settings
from src.core.security import hash_password
from src.infrastructure.database.models import (
    CanonicalTaskRecord,
    GroupMemberRecord,
    GroupRecord,
    LabRecord,
    SkillProfileRecord,
    UserRecord,
)


def build_app():
    return create_app(
        Settings(
            database_url="sqlite+pysqlite:///:memory:",
            database_auto_create=True,
            session_cookie_secure=False,
            app_cors_origins="http://testserver",
        )
    )


def seed(app, *, with_group=True):
    password = hash_password("TestPassword!2026")
    with app.state.db_session_factory() as session:
        leader = UserRecord(
            student_code="LEADER-1",
            email="leader@test.local",
            display_name="Leader Test",
            short_name="Leader",
            role="leader",
            password_hash=password,
            class_scope_id="TEST-CLASS",
        )
        member = UserRecord(
            student_code="MEMBER-1",
            email="member@test.local",
            display_name="Member Test",
            short_name="Member",
            role="member",
            password_hash=password,
            class_scope_id="TEST-CLASS",
        )
        coach = UserRecord(
            student_code="COACH-1",
            email="coach@test.local",
            display_name="Coach Test",
            short_name="Coach",
            role="coach",
            password_hash=password,
            class_scope_id="TEST-CLASS",
        )
        lab = LabRecord(slug="TEST-LAB", title="Test Lab", checklist_version=1)
        session.add_all([leader, member, coach, lab])
        session.flush()
        task = CanonicalTaskRecord(
            lab_id=lab.id,
            task_key="task-1",
            checkpoint_id="cp1",
            task_order=1,
            category="TEST",
            title="Canonical task",
            description="Grounded task",
            deliverable="result.md",
            completion_criteria=["Exists"],
            required_skills=["Backend"],
            depends_on=[],
            reference_ids=["lab://test/v1/task-1"],
        )
        if not with_group:
            session.add(task)
            session.commit()
            return {}
        group = GroupRecord(
            lab_id=lab.id,
            name="Test Group",
            code="TEST-01",
            leader_id=leader.id,
            class_scope_id="TEST-CLASS",
            version=1,
            created_by=leader.id,
            updated_by=leader.id,
        )
        session.add_all([task, group])
        session.flush()
        leader_membership = GroupMemberRecord(
            group_id=group.id,
            user_id=leader.id,
            membership_role="leader",
            invitation_status="accepted",
            profile_status="completed",
            invited_by=leader.id,
        )
        invitation = GroupMemberRecord(
            group_id=group.id,
            user_id=member.id,
            membership_role="member",
            invitation_status="pending",
            profile_status="pending",
            invited_by=leader.id,
        )
        session.add_all([leader_membership, invitation])
        session.flush()
        session.add(
            SkillProfileRecord(
                membership_id=leader_membership.id,
                industry="IT",
                skills=[{"name": "Product Management", "level": 5}],
                updated_by=leader.id,
            )
        )
        session.commit()
        return {"group_id": group.id, "invitation_id": invitation.id}


def login(client: TestClient, email: str):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "TestPassword!2026"},
    )


def test_cookie_session_and_backend_role_authorization():
    app = build_app()
    with TestClient(app) as client:
        seed(app)
        assert client.get("/api/v1/auth/me").status_code == 401
        assert login(client, "coach@test.local").status_code == 200
        assert client.get("/api/v1/groups/current").status_code == 403
        assert client.get("/api/v1/coach/groups").status_code == 200
        assert client.post("/api/v1/auth/logout").status_code == 204
        assert client.get("/api/v1/auth/me").status_code == 401


def test_leader_creates_group_and_invitations_atomically():
    app = build_app()
    with TestClient(app) as leader_client, TestClient(app) as member_client:
        seed(app, with_group=False)
        assert login(leader_client, "leader@test.local").status_code == 200
        directory = leader_client.get("/api/v1/users/directory")
        assert directory.status_code == 200
        assert [item["studentCode"] for item in directory.json()] == ["MEMBER-1"]

        created = leader_client.post(
            "/api/v1/groups",
            json={
                "lab_id": "TEST-LAB",
                "name": "Fresh Group",
                "code": "FRESH-01",
                "invitee_codes": ["MEMBER-1"],
            },
        )
        assert created.status_code == 201
        assert len(created.json()["invitations"]) == 1

        assert login(member_client, "member@test.local").status_code == 200
        snapshot = member_client.get("/api/v1/groups/current")
        assert snapshot.status_code == 200
        member = next(
            item
            for item in snapshot.json()["members"]
            if item["studentCode"] == "MEMBER-1"
        )
        assert member["status"] == "pending"
        assert snapshot.json()["tasks"] == []
        assert member_client.patch(
            "/api/v1/groups/current/tasks/00000000-0000-0000-0000-000000000000",
            json={"status": "done"},
        ).status_code == 403

        group_id = created.json()["id"]
        updated = leader_client.patch(
            f"/api/v1/groups/{group_id}",
            json={"name": "Renamed Group", "code": "RENAMED-01"},
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Renamed Group"
        assert leader_client.delete(
            f"/api/v1/groups/{group_id}/members/{member['id']}"
        ).status_code == 204
        assert member_client.get("/api/v1/groups/current").status_code == 404
        assert leader_client.delete(f"/api/v1/groups/{group_id}").status_code == 204
        assert leader_client.get("/api/v1/groups/current").status_code == 404
        recreated = leader_client.post(
            "/api/v1/groups",
            json={"lab_id": "TEST-LAB", "name": "Recreated Group", "code": "RECREATE-01"},
        )
        assert recreated.status_code == 201


def test_invitation_persists_and_realtime_reconnect_returns_snapshot():
    app = build_app()
    with TestClient(app) as leader_client, TestClient(app) as member_client:
        ids = seed(app)
        assert login(leader_client, "leader@test.local").status_code == 200
        assert login(member_client, "member@test.local").status_code == 200

        with leader_client.websocket_connect("/api/v1/realtime") as websocket:
            first = websocket.receive_json()
            assert first["type"] == "snapshot"
            websocket.send_json({"type": "task.update", "payload": {"status": "done"}})
            rejected = websocket.receive_json()
            assert rejected == {"type": "error", "code": "read_only_socket"}
            response = member_client.post(f"/api/v1/invitations/{ids['invitation_id']}/accept")
            assert response.status_code == 200
            event = websocket.receive_json()
            assert event["type"] == "invitation.accepted"
            assert event["version"] == 2
            assert event["event_id"]

        with leader_client.websocket_connect("/api/v1/realtime") as reconnected:
            snapshot_event = reconnected.receive_json()
            assert snapshot_event["type"] == "snapshot"
            member = next(
                item
                for item in snapshot_event["payload"]["members"]
                if item["studentCode"] == "MEMBER-1"
            )
            assert member["status"] == "accepted"


def test_member_cannot_mutate_before_approved_plan():
    app = build_app()
    with TestClient(app) as client:
        ids = seed(app)
        assert login(client, "member@test.local").status_code == 200
        assert client.post(f"/api/v1/invitations/{ids['invitation_id']}/accept").status_code == 200
        snapshot = client.get("/api/v1/groups/current").json()
        task_id = snapshot["tasks"][0]["id"]
        response = client.patch(
            f"/api/v1/groups/current/tasks/{task_id}",
            json={"status": "done"},
        )
        assert response.status_code == 409


class StubAssignmentGraph:
    def invoke(self, payload):
        owner = next(member for member in payload["members"] if member["name"] == "Member")
        return {
            "status": "ready",
            "assignments": [
                {
                    "task_id": task["id"],
                    "owner_id": owner["id"],
                    "matched_skills": ["Backend"],
                    "reason": "Kỹ năng tự khai phù hợp.",
                    "confidence": "high",
                }
                for task in payload["tasks"]
            ],
            "gaps": [],
        }


def test_three_sessions_persist_full_realtime_workflow():
    app = build_app()
    app.dependency_overrides[get_assignment_graph] = lambda: StubAssignmentGraph()
    with (
        TestClient(app) as leader_client,
        TestClient(app) as member_client,
        TestClient(app) as coach_client,
    ):
        ids = seed(app)
        assert login(leader_client, "leader@test.local").status_code == 200
        assert login(member_client, "member@test.local").status_code == 200
        assert login(coach_client, "coach@test.local").status_code == 200

        with (
            leader_client.websocket_connect("/api/v1/realtime") as leader_ws,
            member_client.websocket_connect("/api/v1/realtime") as member_ws,
            coach_client.websocket_connect("/api/v1/realtime") as coach_ws,
        ):
            assert leader_ws.receive_json()["type"] == "snapshot"
            assert member_ws.receive_json()["type"] == "snapshot"
            assert coach_ws.receive_json()["type"] == "snapshot"

            def expect_all(event_type):
                assert leader_ws.receive_json()["type"] == event_type
                assert member_ws.receive_json()["type"] == event_type
                assert coach_ws.receive_json()["type"] == event_type

            assert (
                member_client.post(f"/api/v1/invitations/{ids['invitation_id']}/accept").status_code
                == 200
            )
            expect_all("invitation.accepted")

            profile = member_client.put(
                f"/api/v1/groups/{ids['group_id']}/members/me/skill-profile",
                json={"industry": "IT", "skills": [{"name": "Backend", "level": 4}]},
            )
            assert profile.status_code == 200
            expect_all("profile.completed")

            first_draft = leader_client.post(
                f"/api/v1/groups/{ids['group_id']}/assignment-drafts"
            )
            assert first_draft.status_code == 201
            expect_all("assignment_draft.created")

            draft = leader_client.post(f"/api/v1/groups/{ids['group_id']}/assignment-drafts")
            assert draft.status_code == 201
            draft_id = draft.json()["id"]
            expect_all("assignment_draft.created")

            stale_approval = leader_client.post(
                f"/api/v1/assignment-drafts/{first_draft.json()['id']}/approve"
            )
            assert stale_approval.status_code == 409

            approved = leader_client.post(f"/api/v1/assignment-drafts/{draft_id}/approve")
            assert approved.status_code == 200
            expect_all("plan.approved")

            snapshot = member_client.get("/api/v1/groups/current").json()
            task = snapshot["tasks"][0]
            updated = member_client.patch(
                f"/api/v1/groups/current/tasks/{task['id']}",
                json={"status": "done", "expected_version": task["version"]},
            )
            assert updated.status_code == 200
            expect_all("task.updated")

            help_request = member_client.post(
                "/api/v1/coach/support-requests",
                json={
                    "groupId": str(ids["group_id"]),
                    "topic": "Blocked task",
                    "question": "Coach hỗ trợ kiểm tra giúp nhóm.",
                    "urgent": True,
                },
            )
            assert help_request.status_code == 201
            request_id = help_request.json()["id"]
            expect_all("help_request.created")

            reply = coach_client.post(
                f"/api/v1/coach/support-requests/{request_id}/replies",
                json={"message": "Coach đã kiểm tra."},
            )
            assert reply.status_code == 201
            expect_all("help_request.replied")

            resolved = coach_client.post(
                f"/api/v1/coach/support-requests/{request_id}/resolve",
                json={},
            )
            assert resolved.status_code == 200
            expect_all("help_request.resolved")

        refreshed = member_client.get("/api/v1/groups/current").json()
        assert refreshed["planStatus"] == "approved"
        assert refreshed["tasks"][0]["status"] == "done"
        coach_dashboard = coach_client.get("/api/v1/coach/groups").json()
        assert coach_dashboard["groups"][0]["progress"] == 100
        assert "skills" not in coach_dashboard["groups"][0]
