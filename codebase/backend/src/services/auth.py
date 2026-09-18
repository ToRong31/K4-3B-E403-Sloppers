from datetime import UTC, datetime, timedelta

from src.core.security import hash_session_token, new_session_token, verify_password
from src.infrastructure.database.models import SessionRecord, UserRecord
from src.infrastructure.database.repositories import AuthRepository
from src.models.auth import SessionUser


class InvalidCredentialsError(Exception):
    pass


class InvalidSessionError(Exception):
    pass


ROLE_LABELS = {"leader": "Nhóm trưởng", "member": "Thành viên", "coach": "Lab Coach"}


def serialize_user(user: UserRecord) -> SessionUser:
    return SessionUser(
        id=user.id,
        accountId=user.student_code,
        email=user.email,
        displayName=user.display_name,
        shortName=user.short_name,
        role=user.role,
        roleLabel=ROLE_LABELS[user.role],
        avatar="GV" if user.role == "coach" else user.short_name[:1].upper(),
        classScopeId=user.class_scope_id,
    )


class AuthService:
    def __init__(self, repository: AuthRepository, ttl_hours: int) -> None:
        self.repository = repository
        self.ttl_hours = ttl_hours

    def login(self, identity: str, password: str) -> tuple[str, SessionRecord]:
        user = self.repository.find_active_user(identity)
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError
        token = new_session_token()
        record = SessionRecord(
            user_id=user.id,
            token_hash=hash_session_token(token),
            expires_at=datetime.now(UTC) + timedelta(hours=self.ttl_hours),
        )
        record.user = user
        self.repository.create_session(record)
        return token, record

    def authenticate(self, token: str | None) -> SessionRecord:
        if not token:
            raise InvalidSessionError
        record = self.repository.get_session(hash_session_token(token))
        now = datetime.now(UTC)
        expires_at = record.expires_at if record else None
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        if (
            record is None
            or record.revoked_at is not None
            or expires_at is None
            or expires_at <= now
            or not record.user.active
        ):
            raise InvalidSessionError
        record.last_seen_at = now
        self.repository.session.commit()
        return record

    def logout(self, token: str | None) -> None:
        if token:
            self.repository.revoke(hash_session_token(token))
