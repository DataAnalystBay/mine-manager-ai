from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
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
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


class RegisterRequest(BaseModel):
    company_name: str
    mine_name: str
    full_name: str
    email: EmailStr
    password: str
    role: str = "Administrator"


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


@router.post("/register")
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    normalized_email = request.email.lower().strip()

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
        company_name=request.company_name.strip(),
        mine_name=request.mine_name.strip(),
        is_active=True,
    )

    try:
        db.add(company)
        db.flush()

        user = User(
            company_id=company.id,
            full_name=request.full_name.strip(),
            email=normalized_email,
            hashed_password=hash_password(request.password),
            role=request.role.strip(),
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(company)
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "User registered successfully",
        "user_id": user.id,
        "company_id": company.id,
    }


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    normalized_email = form_data.username.lower().strip()

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
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "company_id": current_user.company_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": bool(current_user.is_active),
    }