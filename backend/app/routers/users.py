from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_db,
    require_administrator,
)
from app.auth.security import hash_password
from app.models import User
from app.services.audit_log_service import log_audit


router = APIRouter(
    prefix="/api/users",
    tags=["User Management"],
)


ALLOWED_ROLES = {
    "Administrator",
    "General Manager",
    "Mine Manager",
    "Superintendent",
    "Viewer",
}


# ============================================================
# Response and request schemas
# ============================================================

class UserListItem(BaseModel):
    id: int
    company_id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=255,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: str = "Viewer"


class CreateUserResponse(BaseModel):
    message: str
    user: UserListItem


class UpdateUserRequest(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=255,
    )

    email: EmailStr

    role: str


class UpdateUserResponse(BaseModel):
    message: str
    user: UserListItem


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


class UpdateUserStatusResponse(BaseModel):
    message: str
    user: UserListItem


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(
        min_length=8,
        max_length=128,
    )


class ResetPasswordResponse(BaseModel):
    message: str
    user_id: int
    email: EmailStr


# ============================================================
# Helper functions
# ============================================================

def validate_role(role: str) -> str:
    normalized_role = role.strip()

    if normalized_role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid role. Allowed roles are: "
                + ", ".join(sorted(ALLOWED_ROLES))
            ),
        )

    return normalized_role


def get_company_user_or_404(
    user_id: int,
    company_id: int,
    db: Session,
) -> User:
    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.company_id == company_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


# ============================================================
# List company users
# ============================================================

@router.get(
    "",
    response_model=List[UserListItem],
)
def list_company_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_administrator),
):
    users = (
        db.query(User)
        .filter(
            User.company_id == current_user.company_id,
        )
        .order_by(
            User.full_name.asc(),
            User.id.asc(),
        )
        .all()
    )

    return users


# ============================================================
# Create user
# ============================================================

@router.post(
    "",
    response_model=CreateUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_company_user(
    request: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_administrator),
):
    normalized_name = request.full_name.strip()
    normalized_email = request.email.lower().strip()
    normalized_role = validate_role(request.role)

    existing_user = (
        db.query(User)
        .filter(
            User.email == normalized_email,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = User(
        company_id=current_user.company_id,
        full_name=normalized_name,
        email=normalized_email,
        hashed_password=hash_password(request.password),
        role=normalized_role,
        is_active=True,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except Exception:
        db.rollback()
        raise

    log_audit(
        db=db,
        company_id=current_user.company_id,
        actor_user=current_user,
        action="CREATE_USER",
        entity_type="USER",
        entity_id=new_user.id,
        entity_name=new_user.full_name,
        description=(
            f"Created user '{new_user.full_name}' "
            f"({new_user.email}) with role "
            f"'{new_user.role}'."
        ),
        status="SUCCESS",
    )

    return {
        "message": "User created successfully",
        "user": new_user,
    }


# ============================================================
# Update user
# ============================================================

@router.put(
    "/{user_id}",
    response_model=UpdateUserResponse,
)
def update_company_user(
    user_id: int,
    request: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_administrator),
):
    user = get_company_user_or_404(
        user_id=user_id,
        company_id=current_user.company_id,
        db=db,
    )

    old_full_name = user.full_name
    old_email = user.email
    old_role = user.role

    normalized_name = request.full_name.strip()
    normalized_email = request.email.lower().strip()
    normalized_role = validate_role(request.role)

    duplicate_email_user = (
        db.query(User)
        .filter(
            User.email == normalized_email,
            User.id != user.id,
        )
        .first()
    )

    if duplicate_email_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user.full_name = normalized_name
    user.email = normalized_email
    user.role = normalized_role

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    changes = []

    if old_full_name != user.full_name:
        changes.append(
            f"name changed from '{old_full_name}' "
            f"to '{user.full_name}'"
        )

    if old_email != user.email:
        changes.append(
            f"email changed from '{old_email}' "
            f"to '{user.email}'"
        )

    if old_role != user.role:
        changes.append(
            f"role changed from '{old_role}' "
            f"to '{user.role}'"
        )

    change_description = (
        "; ".join(changes)
        if changes
        else "No user profile values changed"
    )

    log_audit(
        db=db,
        company_id=current_user.company_id,
        actor_user=current_user,
        action="UPDATE_USER",
        entity_type="USER",
        entity_id=user.id,
        entity_name=user.full_name,
        description=(
            f"Updated user '{user.full_name}' "
            f"({user.email}): "
            f"{change_description}."
        ),
        status="SUCCESS",
    )

    return {
        "message": "User updated successfully",
        "user": user,
    }


# ============================================================
# Activate or deactivate user
# ============================================================

@router.patch(
    "/{user_id}/status",
    response_model=UpdateUserStatusResponse,
)
def update_company_user_status(
    user_id: int,
    request: UpdateUserStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_administrator),
):
    user = get_company_user_or_404(
        user_id=user_id,
        company_id=current_user.company_id,
        db=db,
    )

    if user.id == current_user.id and not request.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    if user.is_active == request.is_active:
        status_text = (
            "active"
            if request.is_active
            else "inactive"
        )

        return {
            "message": f"User is already {status_text}",
            "user": user,
        }

    user.is_active = request.is_active

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    audit_action = (
        "ACTIVATE_USER"
        if user.is_active
        else "DEACTIVATE_USER"
    )

    audit_description = (
        f"{'Activated' if user.is_active else 'Deactivated'} "
        f"user '{user.full_name}' ({user.email})."
    )

    log_audit(
        db=db,
        company_id=current_user.company_id,
        actor_user=current_user,
        action=audit_action,
        entity_type="USER",
        entity_id=user.id,
        entity_name=user.full_name,
        description=audit_description,
        status="SUCCESS",
    )

    action_text = (
        "activated"
        if user.is_active
        else "deactivated"
    )

    return {
        "message": f"User {action_text} successfully",
        "user": user,
    }


# ============================================================
# Reset user password
# ============================================================

@router.patch(
    "/{user_id}/password",
    response_model=ResetPasswordResponse,
)
def reset_company_user_password(
    user_id: int,
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_administrator),
):
    user = get_company_user_or_404(
        user_id=user_id,
        company_id=current_user.company_id,
        db=db,
    )

    user.hashed_password = hash_password(
        request.new_password,
    )

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    log_audit(
        db=db,
        company_id=current_user.company_id,
        actor_user=current_user,
        action="RESET_PASSWORD",
        entity_type="USER",
        entity_id=user.id,
        entity_name=user.full_name,
        description=(
            f"Reset password for user "
            f"'{user.full_name}' ({user.email})."
        ),
        status="SUCCESS",
    )

    return {
        "message": "Password reset successfully",
        "user_id": user.id,
        "email": user.email,
    }