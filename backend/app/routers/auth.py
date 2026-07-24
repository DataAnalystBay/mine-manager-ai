from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordRequestForm

from app.database import SessionLocal
from app.models import User, Company
from app.auth.security import hash_password, verify_password
from app.auth.jwt_handler import create_access_token


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
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


@router.post("/register")
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == request.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    company = Company(
        company_name=request.company_name,
        mine_name=request.mine_name
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    user = User(
        company_id=company.id,
        full_name=request.full_name,
        email=request.email,
        hashed_password=hash_password(request.password),
        role=request.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully",
        "user_id": user.id,
        "company_id": company.id
    }


@router.post("/login", response_model=LoginResponse)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(User.email == form_data.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "role": user.role,
            "company_id": user.company_id
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "company_id": user.company_id
    }