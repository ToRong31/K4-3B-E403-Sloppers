import argparse
import json
from pathlib import Path

from sqlalchemy import select

from src.core.config import get_settings
from src.core.security import hash_password
from src.infrastructure.database.models import (
    CanonicalTaskRecord,
    GroupMemberRecord,
    GroupRecord,
    LabRecord,
    SkillProfileRecord,
    UserRecord,
)
from src.infrastructure.database.session import create_database_engine, create_session_factory

MANIFEST = (
    Path(__file__).resolve().parents[1] / "data" / "labs" / "k4-l3b-day05-06-mini-hackathon.v1.json"
)
USERS = [
    ("2A202602765", "leader.demo@vlearn.local", "Phạm Hoàng Trọng", "Trọng", "leader"),
    ("2A202602678", "member.demo@vlearn.local", "Lê Thị Thùy Trang", "Trang", "member"),
    ("2A202602676", "duong.demo@vlearn.local", "Lâm Hải Dương", "Dương", "member"),
    ("2A202602523", "dung.demo@vlearn.local", "Hoàng Quốc Dũng", "Dũng", "member"),
    ("COACH-E403", "coach.demo@vlearn.local", "Lab Coach E403", "Coach E403", "coach"),
]
SKILL_HINTS = {
    "prepare": ["Project Management"],
    "cp1": ["User Research", "Product Management"],
    "cp2": ["Frontend", "UI/UX Design"],
    "cp3": ["Prompt Engineering", "Machine Learning", "Data Analysis"],
    "cp4": ["Technical Writing", "Backend"],
    "cp5": ["Presentation", "UI/UX Design"],
    "cp6": ["Project Management", "Presentation"],
}
DEMO_SKILLS = {
    "2A202602765": [("Product Management", 5), ("User Research", 4), ("Project Management", 4)],
    "2A202602676": [("Prompt Engineering", 5), ("Machine Learning", 4), ("Data Analysis", 4)],
    "2A202602523": [("Backend", 5), ("Data Engineering", 4), ("DevOps / Cloud", 4)],
}


def seed(with_group: bool) -> None:
    settings = get_settings()
    if settings.seed_demo_password is None or not settings.seed_demo_password.get_secret_value():
        raise SystemExit("Set SEED_DEMO_PASSWORD before running the demo seed.")
    password_hash = hash_password(settings.seed_demo_password.get_secret_value())
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    engine = create_database_engine(settings)
    session_factory = create_session_factory(engine)
    with session_factory() as session:
        users: dict[str, UserRecord] = {}
        for student_code, email, display_name, short_name, role in USERS:
            user = session.scalar(select(UserRecord).where(UserRecord.student_code == student_code))
            if user is None:
                user = UserRecord(
                    student_code=student_code,
                    email=email,
                    display_name=display_name,
                    short_name=short_name,
                    role=role,
                    password_hash=password_hash,
                    class_scope_id=settings.class_scope_id,
                    active=True,
                )
                session.add(user)
            else:
                user.email = email
                user.display_name = display_name
                user.short_name = short_name
                user.role = role
                user.class_scope_id = settings.class_scope_id
                user.active = True
            users[student_code] = user
        session.flush()

        lab = session.scalar(
            select(LabRecord).where(
                LabRecord.slug == manifest["lab_id"],
                LabRecord.checklist_version == manifest["version"],
            )
        )
        if lab is None:
            lab = LabRecord(
                slug=manifest["lab_id"],
                title=manifest["title"],
                checklist_version=manifest["version"],
            )
            session.add(lab)
            session.flush()
        for checkpoint in manifest["checkpoints"]:
            for item in checkpoint["items"]:
                task = session.scalar(
                    select(CanonicalTaskRecord).where(
                        CanonicalTaskRecord.lab_id == lab.id,
                        CanonicalTaskRecord.task_key == item["item_id"],
                    )
                )
                values = {
                    "checkpoint_id": checkpoint["checkpoint_id"],
                    "task_order": checkpoint["checkpoint_order"] * 100 + item["item_order"],
                    "category": checkpoint["checkpoint_id"].upper(),
                    "title": item["title"],
                    "description": item["content"],
                    "deliverable": item["title"],
                    "completion_criteria": [item["content"]],
                    "required_skills": SKILL_HINTS.get(checkpoint["checkpoint_id"], []),
                    "depends_on": [],
                    "reference_ids": [item["ref_id"]],
                }
                if task is None:
                    task = CanonicalTaskRecord(lab_id=lab.id, task_key=item["item_id"], **values)
                    session.add(task)
                else:
                    for key, value in values.items():
                        setattr(task, key, value)

        if with_group:
            leader = users["2A202602765"]
            group = session.scalar(select(GroupRecord).where(GroupRecord.code == "SLOP-3B"))
            if group is None:
                group = GroupRecord(
                    lab_id=lab.id,
                    name="Sloppers",
                    code="SLOP-3B",
                    leader_id=leader.id,
                    class_scope_id=settings.class_scope_id,
                    status="active",
                    version=1,
                    created_by=leader.id,
                    updated_by=leader.id,
                )
                session.add(group)
                session.flush()
            member_codes = ["2A202602765", "2A202602678", "2A202602676", "2A202602523"]
            for code in member_codes:
                user = users[code]
                is_leader = user.id == leader.id
                demo_ready = code in DEMO_SKILLS
                membership = session.scalar(
                    select(GroupMemberRecord).where(
                        GroupMemberRecord.group_id == group.id, GroupMemberRecord.user_id == user.id
                    )
                )
                if membership is None:
                    membership = GroupMemberRecord(
                        group_id=group.id,
                        user_id=user.id,
                        membership_role="leader" if is_leader else "member",
                        invitation_status="accepted" if demo_ready else "pending",
                        profile_status="completed" if demo_ready else "pending",
                        invited_by=leader.id,
                    )
                    session.add(membership)
                    session.flush()
                else:
                    membership.membership_role = "leader" if is_leader else "member"
                    membership.invitation_status = "accepted" if demo_ready else "pending"
                    membership.profile_status = "completed" if demo_ready else "pending"
                if demo_ready:
                    skills = [{"name": name, "level": level} for name, level in DEMO_SKILLS[code]]
                    if membership.skill_profile is None:
                        session.add(
                            SkillProfileRecord(
                                membership_id=membership.id,
                                industry="IT",
                                skills=skills,
                                updated_by=user.id,
                            )
                        )
                    else:
                        membership.skill_profile.industry = "IT"
                        membership.skill_profile.skills = skills
                        membership.skill_profile.updated_by = user.id
        session.commit()
    engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--with-group",
        action="store_true",
        help="Seed Sloppers with a leader, two ready members and one pending invitation",
    )
    seed(parser.parse_args().with_group)
