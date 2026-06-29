from fastapi import APIRouter, UploadFile, File
import pandas as pd
import shutil

from sqlalchemy import text
from app.database import SessionLocal

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

@router.post("/")
async def upload_excel(file: UploadFile = File(...)):

    # Save uploaded file
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Read Excel file
    df = pd.read_excel(file_path)

    # Create database session
    db = SessionLocal()

    try:

        # Loop through Excel rows
        for _, row in df.iterrows():

            db.execute(
                text("""
                INSERT INTO operations.production_daily
                (
                    report_date,
                    ore_plan,
                    ore_actual,
                    waste_plan,
                    waste_actual
                )
                VALUES
                (
                    :report_date,
                    :ore_plan,
                    :ore_actual,
                    :waste_plan,
                    :waste_actual
                )
                """),
                {
                    "report_date": row["report_date"],
                    "ore_plan": float(row["ore_plan"]),
                    "ore_actual": float(row["ore_actual"]),
                    "waste_plan": float(row["waste_plan"]),
                    "waste_actual": float(row["waste_actual"])
                }
            )

        # Save changes
        db.commit()

        return {
            "status": "success",
            "rows_loaded": len(df),
            "file_name": file.filename,
            "message": "Data loaded into Azure PostgreSQL"
        }

    except Exception as e:

        db.rollback()

        return {
            "status": "error",
            "message": str(e)
        }

    finally:
        db.close()