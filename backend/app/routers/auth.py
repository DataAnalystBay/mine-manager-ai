from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt_handler import create_access_token
from app.auth.security import hash_password, verify_password
from app.database import SessionLocal
from app.models import Company, User


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


def get_db():
    """
    Provide a database session and close it after the request.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


class RegisterRequest(BaseModel):
    """
    Initial system-registration payload.

    Public registration creates only the first company
    and its first Administrator account.
    """

    company_name: str = Field(
        min_length=2,
        max_length=255,
    )

    mine_name: str = Field(
        min_length=2,
        max_length=255,
    )

    full_name: str = Field(
        min_length=2,
        max_length=255,
    )

    email: EmailStr

    password: str = Field(
        min_length=10,
        max_length=128,
    )


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    full_name: str
    email: str
    role: str
    company_id: int


class CurrentUserResponse(BaseModel):
    id: int
    company_id: int
    full_name: str
    email: str
    role: str
    is_active: bool


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Create the first company and first Administrator.

    Once any user exists, public registration is disabled.
    Additional users must be created through the
    Administrator-protected User Management API.
    """

    existing_user_count = db.query(User).count()

    if existing_user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Public registration is disabled. "
                "Ask an Administrator to create the user."
            ),
        )

    normalized_company_name = (
        request.company_name.strip()
    )

    normalized_mine_name = (
        request.mine_name.strip()
    )

    normalized_full_name = (
        request.full_name.strip()
    )

    normalized_email = (
        request.email.lower().strip()
    )

    if len(normalized_company_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Company name must contain at least "
                "2 non-space characters."
            ),
        )

    if len(normalized_mine_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Mine name must contain at least "
                "2 non-space characters."
            ),
        )

    if len(normalized_full_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Full name must contain at least "
                "2 non-space characters."
            ),
        )

    existing_user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    company = Company(
        company_name=normalized_company_name,
        mine_name=normalized_mine_name,
        is_active=True,
    )

    try:
        db.add(company)
        db.flush()

        user = User(
            company_id=company.id,
            full_name=normalized_full_name,
            email=normalized_email,
            hashed_password=hash_password(
                request.password
            ),
            role="Administrator",
            is_active=True,
        )

        db.add(user)
        db.commit()

        db.refresh(company)
        db.refresh(user)

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to complete initial registration."
            ),
        ) from exc

    return {
        "message": (
            "Initial Administrator registered successfully"
        ),
        "user_id": user.id,
        "company_id": company.id,
        "role": user.role,
    }


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Authenticate an active user and issue a JWT access token.
    """

    normalized_email = (
        form_data.username.lower().strip()
    )

    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if not verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if not user.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User company was not found",
        )

    if not user.company.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company account is inactive",
        )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "role": user.role,
            "company_id": user.company_id,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "company_id": user.company_id,
    }


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def get_authenticated_user(
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return the currently authenticated user.
    """

    return {
        "id": current_user.id,
        "company_id": current_user.company_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": bool(
            current_user.is_active
        ),
    }