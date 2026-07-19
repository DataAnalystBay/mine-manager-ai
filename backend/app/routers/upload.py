from fastapi import APIRouter, UploadFile, File, HTTPException
from app.database import SessionLocal
from sqlalchemy import text
import os
import shutil
import pandas as pd

router = APIRouter(prefix="/upload", tags=["Upload Reports"])

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def save_file(file: UploadFile, report_type: str):
    safe_filename = f"{report_type.lower()}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return safe_filename, file_path


def save_upload_log(report_type: str, file_name: str):
    db = SessionLocal()

    try:
        db.execute(
            text("""
                INSERT INTO upload_logs (report_type, file_name, uploaded_by, status)
                VALUES (:report_type, :file_name, :uploaded_by, :status)
            """),
            {
                "report_type": report_type,
                "file_name": file_name,
                "uploaded_by": "Bayarbat",
                "status": "Success",
            },
        )
        db.commit()
    finally:
        db.close()


def import_production_excel(file_path: str):
    df = pd.read_excel(file_path)

    df.columns = [
        str(col).strip().lower().replace(" ", "_")
        for col in df.columns
    ]

    required_columns = [
        "report_date",
        "ore_plan",
        "ore_actual",
        "waste_plan",
        "waste_actual",
    ]

    missing_columns = [
        col for col in required_columns if col not in df.columns
    ]

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {missing_columns}"
        )

    db = SessionLocal()

    try:
        for _, row in df.iterrows():
            db.execute(
                text("""
                    INSERT INTO production_daily
                    (report_date, ore_plan, ore_actual, waste_plan, waste_actual)
                    VALUES
                    (:report_date, :ore_plan, :ore_actual, :waste_plan, :waste_actual)
                """),
                {
                    "report_date": row["report_date"],
                    "ore_plan": row["ore_plan"],
                    "ore_actual": row["ore_actual"],
                    "waste_plan": row["waste_plan"],
                    "waste_actual": row["waste_actual"],
                },
            )

        db.commit()

    finally:
        db.close()


def upload_report(file: UploadFile, report_type: str):
    saved_filename, file_path = save_file(file, report_type)
    save_upload_log(report_type, saved_filename)

    return {
        "message": f"{report_type} report uploaded and saved successfully",
        "filename": saved_filename,
        "file_path": file_path,
    }


@router.post("/production")
async def upload_production(file: UploadFile = File(...)):
    result = upload_report(file, "Production")

    import_production_excel(result["file_path"])

    return {
        "message": "Production report uploaded, saved, and imported into database successfully",
        "filename": result["filename"],
        "file_path": result["file_path"],
    }


@router.post("/fleet")
async def upload_fleet(file: UploadFile = File(...)):
    return upload_report(file, "Fleet")


@router.post("/plant")
async def upload_plant(file: UploadFile = File(...)):
    return upload_report(file, "Plant")


@router.post("/safety")
async def upload_safety(file: UploadFile = File(...)):
    return upload_report(file, "Safety")


@router.get("/history")
def get_upload_history():
    db = SessionLocal()

    try:
        result = db.execute(
            text("""
                SELECT report_type, file_name, uploaded_by, status, uploaded_at
                FROM upload_logs
                ORDER BY uploaded_at DESC
                LIMIT 20
            """)
        )

        rows = result.fetchall()

        return [
            {
                "report_type": row[0],
                "file_name": row[1],
                "uploaded_by": row[2],
                "status": row[3],
                "uploaded_at": str(row[4]),
            }
            for row in rows
        ]

    finally:
        db.close()