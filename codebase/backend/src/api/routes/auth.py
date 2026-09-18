from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from src.api.deps import CurrentUser, get_auth_service
from src.models.auth import LoginRequest, SessionResponse
from src.services.auth import AuthService, InvalidCredentialsError, serialize_user

router = APIRouter(prefix="/auth", tags=["auth"])
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


@router.post("/login", response_model=SessionResponse)
def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    service: AuthServiceDep,
) -> SessionResponse:
    identity = payload.email or payload.account_id
    if not identity:
        raise HTTPException(status_code=422, detail="Cần email hoặc mã tài khoản.")
    try:
        token, auth_session = service.login(identity, payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/mã tài khoản hoặc mật khẩu không đúng.",
        ) from exc
    settings = request.app.state.settings
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        max_age=settings.session_ttl_hours * 3600,
        path="/",
    )
    return SessionResponse(
        user=serialize_user(auth_session.user), expires_at=auth_session.expires_at
    )


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, service: AuthServiceDep) -> None:
    settings = request.app.state.settings
    service.logout(request.cookies.get(settings.session_cookie_name))
    response.delete_cookie(settings.session_cookie_name, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT


@router.get("/me", response_model=SessionResponse)
def me(user: CurrentUser) -> SessionResponse:
    return SessionResponse(user=serialize_user(user))
