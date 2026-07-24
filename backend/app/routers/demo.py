from fastapi import APIRouter
from app.services.demo_data_service import generate_all_demo_data

router = APIRouter(
    prefix="/api/demo",
    tags=["Demo Mode"]
)


@router.post("/load")
def load_demo_data():
    demo_data = generate_all_demo_data()

    return {
        "success": True,
        "message": "Demo Mode data generated successfully",
        "data": demo_data,
    }


@router.post("/reset")
def reset_demo_data():
    return {
        "success": True,
        "message": "Demo Mode reset successfully",
    }