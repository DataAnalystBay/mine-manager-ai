from pathlib import Path

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from sqlalchemy import text

from app.database import SessionLocal


router = APIRouter(prefix="/upload", tags=["Upload Reports"])

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

DEFAULT_MINE_NAME = "Oyu Tolgoi Surface"


def save_file(file: UploadFile, report_type: str):
    original_filename = Path(file.filename or "report.xlsx").name
    safe_filename = f"{report_type.lower()}_{original_filename}"
    file_path = UPLOAD_FOLDER / safe_filename

    try:
        with file_path.open("wb") as buffer:
            while True:
                chunk = file.file.read(1024 * 1024)

                if not chunk:
                    break

                buffer.write(chunk)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to save uploaded file: {exc}",
        ) from exc

    return safe_filename, str(file_path)


def save_upload_log(
    report_type: str,
    file_name: str,
    status: str = "Success",
):
    db = SessionLocal()

    try:
        db.execute(
            text("""
                INSERT INTO public.upload_logs
                    (
                        report_type,
                        file_name,
                        uploaded_by,
                        status
                    )
                VALUES
                    (
                        :report_type,
                        :file_name,
                        :uploaded_by,
                        :status
                    )
            """),
            {
                "report_type": report_type,
                "file_name": file_name,
                "uploaded_by": "Bayarbat",
                "status": status,
            },
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def normalize_production_dataframe(df: pd.DataFrame):
    df.columns = [
        str(column).strip().lower().replace(" ", "_")
        for column in df.columns
    ]

    required_columns = [
        "report_date",
        "ore_plan",
        "ore_actual",
        "waste_plan",
        "waste_actual",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {missing_columns}",
        )

    df = df[required_columns].copy()

    df["report_date"] = pd.to_datetime(
        df["report_date"],
        errors="coerce",
    ).dt.date

    invalid_dates = df["report_date"].isna()

    if invalid_dates.any():
        invalid_rows = [
            int(index) + 2
            for index in df.index[invalid_dates].tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid report_date values found in Excel rows: "
                f"{invalid_rows}"
            ),
        )

    numeric_columns = [
        "ore_plan",
        "ore_actual",
        "waste_plan",
        "waste_actual",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    invalid_numeric_rows = df[numeric_columns].isna().any(axis=1)

    if invalid_numeric_rows.any():
        invalid_rows = [
            int(index) + 2
            for index in df.index[invalid_numeric_rows].tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Missing or invalid production values found in Excel rows: "
                f"{invalid_rows}"
            ),
        )

    duplicate_dates = df[
        df.duplicated(
            subset=["report_date"],
            keep=False,
        )
    ]["report_date"].astype(str).unique().tolist()

    if duplicate_dates:
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded Excel file contains duplicate report dates: "
                f"{duplicate_dates}"
            ),
        )

    return df


def import_production_excel(
    file_path: str,
    mine_name: str,
):
    normalized_mine_name = str(mine_name or "").strip()

    if not normalized_mine_name:
        raise HTTPException(
            status_code=400,
            detail="mine_name is required.",
        )

    try:
        df = pd.read_excel(file_path)

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read production Excel file: {exc}",
        ) from exc

    df = normalize_production_dataframe(df)

    db = SessionLocal()

    inserted_count = 0
    updated_count = 0

    try:
        for _, row in df.iterrows():
            existing_id = db.execute(
                text("""
                    SELECT id
                    FROM public.production_daily
                    WHERE mine_name = :mine_name
                      AND report_date = :report_date
                """),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                },
            ).scalar_one_or_none()

            db.execute(
                text("""
                    INSERT INTO public.production_daily
                        (
                            mine_name,
                            report_date,
                            ore_plan,
                            ore_actual,
                            waste_plan,
                            waste_actual
                        )
                    VALUES
                        (
                            :mine_name,
                            :report_date,
                            :ore_plan,
                            :ore_actual,
                            :waste_plan,
                            :waste_actual
                        )
                    ON CONFLICT
                        (mine_name, report_date)
                    DO UPDATE SET
                        ore_plan = EXCLUDED.ore_plan,
                        ore_actual = EXCLUDED.ore_actual,
                        waste_plan = EXCLUDED.waste_plan,
                        waste_actual = EXCLUDED.waste_actual,
                        created_at = CURRENT_TIMESTAMP
                """),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                    "ore_plan": float(row["ore_plan"]),
                    "ore_actual": float(row["ore_actual"]),
                    "waste_plan": float(row["waste_plan"]),
                    "waste_actual": float(row["waste_actual"]),
                },
            )

            if existing_id is None:
                inserted_count += 1
            else:
                updated_count += 1

        db.commit()

        return {
            "mine_name": normalized_mine_name,
            "processed_rows": int(len(df)),
            "inserted_rows": inserted_count,
            "updated_rows": updated_count,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Production import failed: {exc}",
        ) from exc

    finally:
        db.close()


def upload_report(
    file: UploadFile,
    report_type: str,
):
    saved_filename, file_path = save_file(
        file=file,
        report_type=report_type,
    )

    return {
        "filename": saved_filename,
        "file_path": file_path,
    }


@router.post("/production")
async def upload_production(
    file: UploadFile = File(...),
    mine_name: str = Form(DEFAULT_MINE_NAME),
):
    upload_result = upload_report(
        file=file,
        report_type="Production",
    )

    try:
        import_result = import_production_excel(
            file_path=upload_result["file_path"],
            mine_name=mine_name,
        )

        save_upload_log(
            report_type="Production",
            file_name=upload_result["filename"],
            status="Success",
        )

    except Exception:
        save_upload_log(
            report_type="Production",
            file_name=upload_result["filename"],
            status="Failed",
        )
        raise

    return {
        "message": "Production report uploaded and synchronized successfully.",
        "filename": upload_result["filename"],
        "file_path": upload_result["file_path"],
        **import_result,
    }


@router.post("/fleet")
async def upload_fleet(
    file: UploadFile = File(...),
):
    result = upload_report(
        file=file,
        report_type="Fleet",
    )

    save_upload_log(
        report_type="Fleet",
        file_name=result["filename"],
    )

    return {
        "message": "Fleet report uploaded successfully.",
        **result,
    }


@router.post("/plant")
async def upload_plant(
    file: UploadFile = File(...),
):
    result = upload_report(
        file=file,
        report_type="Plant",
    )

    save_upload_log(
        report_type="Plant",
        file_name=result["filename"],
    )

    return {
        "message": "Plant report uploaded successfully.",
        **result,
    }


@router.post("/safety")
async def upload_safety(
    file: UploadFile = File(...),
):
    result = upload_report(
        file=file,
        report_type="Safety",
    )

    save_upload_log(
        report_type="Safety",
        file_name=result["filename"],
    )

    return {
        "message": "Safety report uploaded successfully.",
        **result,
    }


@router.get("/history")
def get_upload_history():
    db = SessionLocal()

    try:
        rows = db.execute(
            text("""
                SELECT
                    report_type,
                    file_name,
                    uploaded_by,
                    status,
                    uploaded_at
                FROM public.upload_logs
                ORDER BY uploaded_at DESC
                LIMIT 20
            """)
        ).mappings().all()

        return [
            {
                "report_type": row["report_type"],
                "file_name": row["file_name"],
                "uploaded_by": row["uploaded_by"],
                "status": row["status"],
                "uploaded_at": str(row["uploaded_at"]),
            }
            for row in rows
        ]

    finally:
        db.close()
