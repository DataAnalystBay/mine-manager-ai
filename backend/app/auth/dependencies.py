from __future__ import annotations

import os

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.auth.jwt_handler import ALGORITHM, SECRET_KEY
from app.database import SessionLocal
from app.models import User


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
)


def get_db():
    """
    Provide a SQLAlchemy session and close it after the request.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a Mine Manager AI JWT access token.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        email = payload.get("sub")
        user_id = payload.get("user_id")
        company_id = payload.get("company_id")

        if not email or not user_id or not company_id:
            raise credentials_exception

        return payload

    except JWTError as exc:
        raise credentials_exception from exc


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Return the authenticated active user.
    """

    payload = decode_access_token(token)

    user_id = payload.get("user_id")
    email = payload.get("sub")
    company_id = payload.get("company_id")

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.email == email,
            User.company_id == company_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user was not found",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


def require_administrator(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Allow only active users with the Administrator role.
    """

    normalized_role = str(
        current_user.role or ""
    ).strip().lower()

    if normalized_role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required",
        )

    return current_user