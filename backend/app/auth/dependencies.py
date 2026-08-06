from __future__ import annotations

from collections.abc import Callable
from typing import Final

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


# ============================================================
# SUPPORTED ROLES
# ============================================================

ROLE_ADMINISTRATOR: Final[str] = "administrator"
ROLE_GENERAL_MANAGER: Final[str] = "general manager"
ROLE_MINE_MANAGER: Final[str] = "mine manager"
ROLE_SUPERINTENDENT: Final[str] = "superintendent"
ROLE_VIEWER: Final[str] = "viewer"


VALID_ROLES: Final[set[str]] = {
    ROLE_ADMINISTRATOR,
    ROLE_GENERAL_MANAGER,
    ROLE_MINE_MANAGER,
    ROLE_SUPERINTENDENT,
    ROLE_VIEWER,
}


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    """
    Provide a SQLAlchemy database session and close it safely
    after the request is completed.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# ROLE NORMALIZATION
# ============================================================

def normalize_role(role: str | None) -> str:
    """
    Convert a stored role into a consistent comparison value.

    Examples:
        "Administrator" -> "administrator"
        "General Manager" -> "general manager"
        "Mine_Manager" -> "mine manager"
    """

    return (
        str(role or "")
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )


# ============================================================
# AUTHENTICATION EXCEPTIONS
# ============================================================

def get_credentials_exception() -> HTTPException:
    """
    Return the standard invalid-token response.
    """

    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=(
            "Could not validate authentication credentials"
        ),
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


# ============================================================
# TOKEN DECODING
# ============================================================

def decode_access_token(
    token: str,
) -> dict:
    """
    Decode and validate a Mine Manager AI JWT access token.

    Required token claims:
        - sub
        - user_id
        - company_id
    """

    credentials_exception = (
        get_credentials_exception()
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

        if not email:
            raise credentials_exception

        if user_id is None:
            raise credentials_exception

        if company_id is None:
            raise credentials_exception

        try:
            normalized_user_id = int(user_id)
            normalized_company_id = int(company_id)
        except (TypeError, ValueError) as exc:
            raise credentials_exception from exc

        if normalized_user_id <= 0:
            raise credentials_exception

        if normalized_company_id <= 0:
            raise credentials_exception

        payload["user_id"] = normalized_user_id
        payload["company_id"] = (
            normalized_company_id
        )
        payload["sub"] = str(email).strip().lower()

        return payload

    except HTTPException:
        raise

    except JWTError as exc:
        raise credentials_exception from exc


# ============================================================
# CURRENT AUTHENTICATED USER
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Return the active authenticated user represented by the JWT.

    The user ID, email, and company ID must all match the
    current database record.
    """

    payload = decode_access_token(token)

    user_id = payload["user_id"]
    email = payload["sub"]
    company_id = payload["company_id"]

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
            detail=(
                "Authenticated user was not found"
            ),
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if not bool(user.is_active):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if not user.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User company was not found",
        )

    if not bool(user.company.is_active):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company account is inactive",
        )

    normalized_role = normalize_role(
        user.role
    )

    if normalized_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "The user account has an invalid "
                "or unsupported role"
            ),
        )

    return user


# ============================================================
# GENERIC ROLE AUTHORIZATION
# ============================================================

def require_roles(
    *allowed_roles: str,
) -> Callable:
    """
    Create a FastAPI dependency that permits only selected roles.

    Example:

        dependencies=[
            Depends(
                require_roles(
                    "Administrator",
                    "General Manager",
                )
            )
        ]
    """

    normalized_allowed_roles = {
        normalize_role(role)
        for role in allowed_roles
        if normalize_role(role)
    }

    if not normalized_allowed_roles:
        raise ValueError(
            "At least one allowed role is required."
        )

    invalid_roles = (
        normalized_allowed_roles - VALID_ROLES
    )

    if invalid_roles:
        raise ValueError(
            "Unsupported authorization roles: "
            f"{sorted(invalid_roles)}"
        )

    def role_dependency(
        current_user: User = Depends(
            get_current_user
        ),
    ) -> User:
        normalized_user_role = normalize_role(
            current_user.role
        )

        if (
            normalized_user_role
            not in normalized_allowed_roles
        ):
            allowed_role_names = ", ".join(
                sorted(
                    role.title()
                    for role
                    in normalized_allowed_roles
                )
            )

            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail=(
                    "Access requires one of the "
                    f"following roles: "
                    f"{allowed_role_names}"
                ),
            )

        return current_user

    return role_dependency


# ============================================================
# NAMED ROLE DEPENDENCIES
# ============================================================

def require_administrator(
    current_user: User = Depends(
        get_current_user
    ),
) -> User:
    """
    Allow only users with the Administrator role.
    """

    if (
        normalize_role(current_user.role)
        != ROLE_ADMINISTRATOR
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Administrator access is required"
            ),
        )

    return current_user


def require_general_manager_or_administrator(
    current_user: User = Depends(
        get_current_user
    ),
) -> User:
    """
    Allow General Managers and Administrators.
    """

    allowed_roles = {
        ROLE_GENERAL_MANAGER,
        ROLE_ADMINISTRATOR,
    }

    if (
        normalize_role(current_user.role)
        not in allowed_roles
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "General Manager or Administrator "
                "access is required"
            ),
        )

    return current_user


def require_mine_management(
    current_user: User = Depends(
        get_current_user
    ),
) -> User:
    """
    Allow Mine Managers, General Managers,
    and Administrators.
    """

    allowed_roles = {
        ROLE_MINE_MANAGER,
        ROLE_GENERAL_MANAGER,
        ROLE_ADMINISTRATOR,
    }

    if (
        normalize_role(current_user.role)
        not in allowed_roles
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Mine Manager, General Manager, "
                "or Administrator access is required"
            ),
        )

    return current_user


def require_operational_editor(
    current_user: User = Depends(
        get_current_user
    ),
) -> User:
    """
    Allow operational users who may create or update
    executive actions and operational records.

    Viewer accounts are excluded.
    """

    allowed_roles = {
        ROLE_SUPERINTENDENT,
        ROLE_MINE_MANAGER,
        ROLE_GENERAL_MANAGER,
        ROLE_ADMINISTRATOR,
    }

    if (
        normalize_role(current_user.role)
        not in allowed_roles
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This operation requires "
                "Superintendent, Mine Manager, "
                "General Manager, or Administrator access"
            ),
        )

    return current_user


def require_report_uploader(
    current_user: User = Depends(
        get_current_user
    ),
) -> User:
    """
    Allow authorized operational roles to upload reports.

    Viewer accounts are read-only.
    """

    allowed_roles = {
        ROLE_SUPERINTENDENT,
        ROLE_MINE_MANAGER,
        ROLE_GENERAL_MANAGER,
        ROLE_ADMINISTRATOR,
    }

    if (
        normalize_role(current_user.role)
        not in allowed_roles
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Report upload requires "
                "Superintendent, Mine Manager, "
                "General Manager, or Administrator access"
            ),
        )

    return current_user