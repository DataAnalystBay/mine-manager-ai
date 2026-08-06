from pathlib import Path

import pandas as pd
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy import text

from app.auth.dependencies import (
    get_current_user,
    require_report_uploader,
)
from app.database import SessionLocal


router = APIRouter(
    prefix="/upload",
    tags=["Upload Reports"],
    dependencies=[
        Depends(get_current_user),
    ],
)

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(
    parents=True,
    exist_ok=True,
)

DEFAULT_MINE_NAME = "Oyu Tolgoi Surface"


# ============================================================
# FILE STORAGE
# ============================================================

def save_file(
    file: UploadFile,
    report_type: str,
):
    """
    Save an uploaded report to the local uploads folder.
    """

    original_filename = Path(
        file.filename or "report.xlsx"
    ).name

    safe_filename = (
        f"{report_type.lower()}_{original_filename}"
    )

    file_path = UPLOAD_FOLDER / safe_filename

    try:
        with file_path.open("wb") as buffer:
            while True:
                chunk = file.file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                buffer.write(chunk)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to save uploaded file: {exc}"
            ),
        ) from exc

    return safe_filename, str(file_path)


# ============================================================
# UPLOAD LOG
# ============================================================

def save_upload_log(
    report_type: str,
    file_name: str,
    status: str = "Success",
):
    """
    Save an upload result to the upload history table.
    """

    db = SessionLocal()

    try:
        db.execute(
            text(
                """
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
                """
            ),
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


# ============================================================
# COMMON DATAFRAME HELPERS
# ============================================================

def normalize_column_names(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Normalize Excel column names to lowercase snake_case.
    """

    df.columns = [
        str(column)
        .strip()
        .lower()
        .replace(" ", "_")
        for column in df.columns
    ]

    return df


def validate_required_columns(
    df: pd.DataFrame,
    required_columns: list[str],
    report_name: str,
):
    """
    Confirm that all required Excel columns are present.
    """

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Missing required {report_name} columns: "
                f"{missing_columns}"
            ),
        )


def normalize_report_dates(
    df: pd.DataFrame,
    report_name: str,
) -> pd.DataFrame:
    """
    Convert report_date values to Python date values.
    """

    df["report_date"] = pd.to_datetime(
        df["report_date"],
        errors="coerce",
    ).dt.date

    invalid_dates = df["report_date"].isna()

    if invalid_dates.any():
        invalid_rows = [
            int(index) + 2
            for index in df.index[
                invalid_dates
            ].tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid report_date values found "
                f"in {report_name} Excel rows: "
                f"{invalid_rows}"
            ),
        )

    return df


def normalize_numeric_columns(
    df: pd.DataFrame,
    numeric_columns: list[str],
    report_name: str,
) -> pd.DataFrame:
    """
    Convert required numeric fields to numeric values.
    """

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    invalid_numeric_rows = df[
        numeric_columns
    ].isna().any(
        axis=1
    )

    if invalid_numeric_rows.any():
        invalid_rows = [
            int(index) + 2
            for index in df.index[
                invalid_numeric_rows
            ].tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                f"Missing or invalid {report_name} values "
                "found in Excel rows: "
                f"{invalid_rows}"
            ),
        )

    return df


def validate_duplicate_dates(
    df: pd.DataFrame,
    report_name: str,
):
    """
    Reject duplicate report dates in one uploaded report.
    """

    duplicate_dates = df[
        df.duplicated(
            subset=["report_date"],
            keep=False,
        )
    ]["report_date"].astype(
        str
    ).unique().tolist()

    if duplicate_dates:
        raise HTTPException(
            status_code=400,
            detail=(
                f"The uploaded {report_name} Excel file "
                "contains duplicate report dates: "
                f"{duplicate_dates}"
            ),
        )


# ============================================================
# PRODUCTION NORMALIZATION
# ============================================================

def normalize_production_dataframe(
    df: pd.DataFrame,
):
    """
    Validate and normalize a Production Excel report.
    """

    df = normalize_column_names(df)

    required_columns = [
        "report_date",
        "ore_plan",
        "ore_actual",
        "waste_plan",
        "waste_actual",
    ]

    validate_required_columns(
        df=df,
        required_columns=required_columns,
        report_name="Production",
    )

    df = df[required_columns].copy()

    df = normalize_report_dates(
        df=df,
        report_name="Production",
    )

    numeric_columns = [
        "ore_plan",
        "ore_actual",
        "waste_plan",
        "waste_actual",
    ]

    df = normalize_numeric_columns(
        df=df,
        numeric_columns=numeric_columns,
        report_name="Production",
    )

    invalid_range_rows = df[
        (df["ore_plan"] < 0)
        | (df["ore_actual"] < 0)
        | (df["waste_plan"] < 0)
        | (df["waste_actual"] < 0)
    ]

    if not invalid_range_rows.empty:
        invalid_rows = [
            int(index) + 2
            for index in invalid_range_rows.index.tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Production values cannot be negative. "
                f"Invalid Excel rows: {invalid_rows}"
            ),
        )

    validate_duplicate_dates(
        df=df,
        report_name="Production",
    )

    return df


# ============================================================
# FLEET NORMALIZATION
# ============================================================

def normalize_fleet_dataframe(
    df: pd.DataFrame,
):
    """
    Validate and normalize a Fleet Excel report.

    Required columns:
    - report_date
    - availability
    - utilization
    """

    df = normalize_column_names(df)

    required_columns = [
        "report_date",
        "availability",
        "utilization",
    ]

    validate_required_columns(
        df=df,
        required_columns=required_columns,
        report_name="Fleet",
    )

    df = df[required_columns].copy()

    df = normalize_report_dates(
        df=df,
        report_name="Fleet",
    )

    numeric_columns = [
        "availability",
        "utilization",
    ]

    df = normalize_numeric_columns(
        df=df,
        numeric_columns=numeric_columns,
        report_name="Fleet",
    )

    invalid_range_rows = df[
        (df["availability"] < 0)
        | (df["availability"] > 100)
        | (df["utilization"] < 0)
        | (df["utilization"] > 100)
    ]

    if not invalid_range_rows.empty:
        invalid_rows = [
            int(index) + 2
            for index in invalid_range_rows.index.tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Fleet availability and utilization "
                "must be between 0 and 100. "
                f"Invalid Excel rows: {invalid_rows}"
            ),
        )

    validate_duplicate_dates(
        df=df,
        report_name="Fleet",
    )

    return df


# ============================================================
# PLANT NORMALIZATION
# ============================================================

def normalize_plant_dataframe(
    df: pd.DataFrame,
):
    """
    Validate and normalize a Plant Excel report.

    Required columns:
    - report_date
    - throughput_plan
    - throughput_actual
    - recovery
    """

    df = normalize_column_names(df)

    required_columns = [
        "report_date",
        "throughput_plan",
        "throughput_actual",
        "recovery",
    ]

    validate_required_columns(
        df=df,
        required_columns=required_columns,
        report_name="Plant",
    )

    df = df[required_columns].copy()

    df = normalize_report_dates(
        df=df,
        report_name="Plant",
    )

    numeric_columns = [
        "throughput_plan",
        "throughput_actual",
        "recovery",
    ]

    df = normalize_numeric_columns(
        df=df,
        numeric_columns=numeric_columns,
        report_name="Plant",
    )

    invalid_range_rows = df[
        (df["throughput_plan"] < 0)
        | (df["throughput_actual"] < 0)
        | (df["recovery"] < 0)
        | (df["recovery"] > 100)
    ]

    if not invalid_range_rows.empty:
        invalid_rows = [
            int(index) + 2
            for index in invalid_range_rows.index.tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Plant throughput values cannot be negative, "
                "and recovery must be between 0 and 100. "
                f"Invalid Excel rows: {invalid_rows}"
            ),
        )

    validate_duplicate_dates(
        df=df,
        report_name="Plant",
    )

    return df


# ============================================================
# SAFETY NORMALIZATION
# ============================================================

def normalize_safety_dataframe(
    df: pd.DataFrame,
):
    """
    Validate and normalize a Safety Excel report.

    Required columns:
    - report_date
    - incidents
    - near_misses
    - critical_risks
    - safety_score
    """

    df = normalize_column_names(df)

    required_columns = [
        "report_date",
        "incidents",
        "near_misses",
        "critical_risks",
        "safety_score",
    ]

    validate_required_columns(
        df=df,
        required_columns=required_columns,
        report_name="Safety",
    )

    df = df[required_columns].copy()

    df = normalize_report_dates(
        df=df,
        report_name="Safety",
    )

    numeric_columns = [
        "incidents",
        "near_misses",
        "critical_risks",
        "safety_score",
    ]

    df = normalize_numeric_columns(
        df=df,
        numeric_columns=numeric_columns,
        report_name="Safety",
    )

    invalid_range_rows = df[
        (df["incidents"] < 0)
        | (df["near_misses"] < 0)
        | (df["critical_risks"] < 0)
        | (df["safety_score"] < 0)
        | (df["safety_score"] > 100)
    ]

    if not invalid_range_rows.empty:
        invalid_rows = [
            int(index) + 2
            for index in invalid_range_rows.index.tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Safety counts cannot be negative, "
                "and safety_score must be between 0 and 100. "
                f"Invalid Excel rows: {invalid_rows}"
            ),
        )

    integer_columns = [
        "incidents",
        "near_misses",
        "critical_risks",
    ]

    non_integer_rows = df[
        integer_columns
    ].apply(
        lambda series: series % 1 != 0
    ).any(
        axis=1
    )

    if non_integer_rows.any():
        invalid_rows = [
            int(index) + 2
            for index in df.index[
                non_integer_rows
            ].tolist()
        ]

        raise HTTPException(
            status_code=400,
            detail=(
                "Safety incident, near-miss, and critical-risk "
                "values must be whole numbers. "
                f"Invalid Excel rows: {invalid_rows}"
            ),
        )

    for column in integer_columns:
        df[column] = df[column].astype(int)

    validate_duplicate_dates(
        df=df,
        report_name="Safety",
    )

    return df


# ============================================================
# PRODUCTION DATABASE IMPORT
# ============================================================

def import_production_excel(
    file_path: str,
    mine_name: str,
):
    """
    Import Production Excel data into PostgreSQL.
    """

    normalized_mine_name = str(
        mine_name or ""
    ).strip()

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
            detail=(
                "Unable to read Production "
                f"Excel file: {exc}"
            ),
        ) from exc

    df = normalize_production_dataframe(df)

    db = SessionLocal()

    inserted_count = 0
    updated_count = 0

    try:
        for _, row in df.iterrows():
            existing_id = db.execute(
                text(
                    """
                    SELECT id
                    FROM public.production_daily
                    WHERE mine_name = :mine_name
                      AND report_date = :report_date
                    """
                ),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                },
            ).scalar_one_or_none()

            db.execute(
                text(
                    """
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
                        ore_plan =
                            EXCLUDED.ore_plan,
                        ore_actual =
                            EXCLUDED.ore_actual,
                        waste_plan =
                            EXCLUDED.waste_plan,
                        waste_actual =
                            EXCLUDED.waste_actual,
                        created_at =
                            CURRENT_TIMESTAMP
                    """
                ),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                    "ore_plan": float(
                        row["ore_plan"]
                    ),
                    "ore_actual": float(
                        row["ore_actual"]
                    ),
                    "waste_plan": float(
                        row["waste_plan"]
                    ),
                    "waste_actual": float(
                        row["waste_actual"]
                    ),
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


# ============================================================
# FLEET DATABASE IMPORT
# ============================================================

def import_fleet_excel(
    file_path: str,
    mine_name: str,
):
    """
    Import Fleet Excel data into PostgreSQL.
    """

    normalized_mine_name = str(
        mine_name or ""
    ).strip()

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
            detail=(
                "Unable to read Fleet "
                f"Excel file: {exc}"
            ),
        ) from exc

    df = normalize_fleet_dataframe(df)

    db = SessionLocal()

    inserted_count = 0
    updated_count = 0

    try:
        for _, row in df.iterrows():
            existing_id = db.execute(
                text(
                    """
                    SELECT id
                    FROM public.fleet_daily
                    WHERE mine_name = :mine_name
                      AND report_date = :report_date
                    """
                ),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                },
            ).scalar_one_or_none()

            db.execute(
                text(
                    """
                    INSERT INTO public.fleet_daily
                    (
                        mine_name,
                        report_date,
                        availability,
                        utilization
                    )
                    VALUES
                    (
                        :mine_name,
                        :report_date,
                        :availability,
                        :utilization
                    )
                    ON CONFLICT
                        (mine_name, report_date)
                    DO UPDATE SET
                        availability =
                            EXCLUDED.availability,
                        utilization =
                            EXCLUDED.utilization,
                        created_at =
                            CURRENT_TIMESTAMP
                    """
                ),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                    "availability": float(
                        row["availability"]
                    ),
                    "utilization": float(
                        row["utilization"]
                    ),
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
            detail=f"Fleet import failed: {exc}",
        ) from exc

    finally:
        db.close()


# ============================================================
# PLANT DATABASE IMPORT
# ============================================================

def import_plant_excel(
    file_path: str,
    mine_name: str,
):
    """
    Import Plant Excel data into PostgreSQL.
    """

    normalized_mine_name = str(
        mine_name or ""
    ).strip()

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
            detail=(
                "Unable to read Plant "
                f"Excel file: {exc}"
            ),
        ) from exc

    df = normalize_plant_dataframe(df)

    db = SessionLocal()

    inserted_count = 0
    updated_count = 0

    try:
        for _, row in df.iterrows():
            existing_id = db.execute(
                text(
                    """
                    SELECT id
                    FROM public.plant_daily
                    WHERE mine_name = :mine_name
                      AND report_date = :report_date
                    """
                ),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                },
            ).scalar_one_or_none()

            db.execute(
                text(
                    """
                    INSERT INTO public.plant_daily
                    (
                        mine_name,
                        report_date,
                        throughput_plan,
                        throughput_actual,
                        recovery
                    )
                    VALUES
                    (
                        :mine_name,
                        :report_date,
                        :throughput_plan,
                        :throughput_actual,
                        :recovery
                    )
                    ON CONFLICT
                        (mine_name, report_date)
                    DO UPDATE SET
                        throughput_plan =
                            EXCLUDED.throughput_plan,
                        throughput_actual =
                            EXCLUDED.throughput_actual,
                        recovery =
                            EXCLUDED.recovery,
                        created_at =
                            CURRENT_TIMESTAMP
                    """
                ),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                    "throughput_plan": float(
                        row["throughput_plan"]
                    ),
                    "throughput_actual": float(
                        row["throughput_actual"]
                    ),
                    "recovery": float(
                        row["recovery"]
                    ),
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
            detail=f"Plant import failed: {exc}",
        ) from exc

    finally:
        db.close()


# ============================================================
# SAFETY DATABASE IMPORT
# ============================================================

def import_safety_excel(
    file_path: str,
    mine_name: str,
):
    """
    Import Safety Excel data into PostgreSQL.
    """

    normalized_mine_name = str(
        mine_name or ""
    ).strip()

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
            detail=(
                "Unable to read Safety "
                f"Excel file: {exc}"
            ),
        ) from exc

    df = normalize_safety_dataframe(df)

    db = SessionLocal()

    inserted_count = 0
    updated_count = 0

    try:
        for _, row in df.iterrows():
            existing_id = db.execute(
                text(
                    """
                    SELECT id
                    FROM public.safety_daily
                    WHERE mine_name = :mine_name
                      AND report_date = :report_date
                    """
                ),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                },
            ).scalar_one_or_none()

            db.execute(
                text(
                    """
                    INSERT INTO public.safety_daily
                    (
                        mine_name,
                        report_date,
                        incidents,
                        near_misses,
                        critical_risks,
                        safety_score
                    )
                    VALUES
                    (
                        :mine_name,
                        :report_date,
                        :incidents,
                        :near_misses,
                        :critical_risks,
                        :safety_score
                    )
                    ON CONFLICT
                        (mine_name, report_date)
                    DO UPDATE SET
                        incidents =
                            EXCLUDED.incidents,
                        near_misses =
                            EXCLUDED.near_misses,
                        critical_risks =
                            EXCLUDED.critical_risks,
                        safety_score =
                            EXCLUDED.safety_score,
                        created_at =
                            CURRENT_TIMESTAMP
                    """
                ),
                {
                    "mine_name": normalized_mine_name,
                    "report_date": row["report_date"],
                    "incidents": int(
                        row["incidents"]
                    ),
                    "near_misses": int(
                        row["near_misses"]
                    ),
                    "critical_risks": int(
                        row["critical_risks"]
                    ),
                    "safety_score": float(
                        row["safety_score"]
                    ),
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
            detail=f"Safety import failed: {exc}",
        ) from exc

    finally:
        db.close()


# ============================================================
# GENERIC FILE UPLOAD
# ============================================================

def upload_report(
    file: UploadFile,
    report_type: str,
):
    """
    Save a report file and return its stored path.
    """

    saved_filename, file_path = save_file(
        file=file,
        report_type=report_type,
    )

    return {
        "filename": saved_filename,
        "file_path": file_path,
    }


# ============================================================
# PRODUCTION ENDPOINT
# ============================================================

@router.post(
    "/production",
    dependencies=[
        Depends(require_report_uploader),
    ],
)
async def upload_production(
    file: UploadFile = File(...),
    mine_name: str = Form(
        DEFAULT_MINE_NAME
    ),
):
    """
    Upload and synchronize Production data
    with PostgreSQL.
    """

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
        "message": (
            "Production report uploaded and "
            "synchronized successfully."
        ),
        "filename": upload_result["filename"],
        "file_path": upload_result["file_path"],
        **import_result,
    }


# ============================================================
# FLEET ENDPOINT
# ============================================================

@router.post(
    "/fleet",
    dependencies=[
        Depends(require_report_uploader),
    ],
)
async def upload_fleet(
    file: UploadFile = File(...),
    mine_name: str = Form(
        DEFAULT_MINE_NAME
    ),
):
    """
    Upload and synchronize Fleet data
    with PostgreSQL.
    """

    upload_result = upload_report(
        file=file,
        report_type="Fleet",
    )

    try:
        import_result = import_fleet_excel(
            file_path=upload_result["file_path"],
            mine_name=mine_name,
        )

        save_upload_log(
            report_type="Fleet",
            file_name=upload_result["filename"],
            status="Success",
        )

    except Exception:
        save_upload_log(
            report_type="Fleet",
            file_name=upload_result["filename"],
            status="Failed",
        )
        raise

    return {
        "message": (
            "Fleet report uploaded and "
            "synchronized successfully."
        ),
        "filename": upload_result["filename"],
        "file_path": upload_result["file_path"],
        **import_result,
    }


# ============================================================
# PLANT ENDPOINT
# ============================================================

@router.post(
    "/plant",
    dependencies=[
        Depends(require_report_uploader),
    ],
)
async def upload_plant(
    file: UploadFile = File(...),
    mine_name: str = Form(
        DEFAULT_MINE_NAME
    ),
):
    """
    Upload and synchronize Plant data
    with PostgreSQL.
    """

    upload_result = upload_report(
        file=file,
        report_type="Plant",
    )

    try:
        import_result = import_plant_excel(
            file_path=upload_result["file_path"],
            mine_name=mine_name,
        )

        save_upload_log(
            report_type="Plant",
            file_name=upload_result["filename"],
            status="Success",
        )

    except Exception:
        save_upload_log(
            report_type="Plant",
            file_name=upload_result["filename"],
            status="Failed",
        )
        raise

    return {
        "message": (
            "Plant report uploaded and "
            "synchronized successfully."
        ),
        "filename": upload_result["filename"],
        "file_path": upload_result["file_path"],
        **import_result,
    }


# ============================================================
# SAFETY ENDPOINT
# ============================================================

@router.post(
    "/safety",
    dependencies=[
        Depends(require_report_uploader),
    ],
)
async def upload_safety(
    file: UploadFile = File(...),
    mine_name: str = Form(
        DEFAULT_MINE_NAME
    ),
):
    """
    Upload and synchronize Safety data
    with PostgreSQL.
    """

    upload_result = upload_report(
        file=file,
        report_type="Safety",
    )

    try:
        import_result = import_safety_excel(
            file_path=upload_result["file_path"],
            mine_name=mine_name,
        )

        save_upload_log(
            report_type="Safety",
            file_name=upload_result["filename"],
            status="Success",
        )

    except Exception:
        save_upload_log(
            report_type="Safety",
            file_name=upload_result["filename"],
            status="Failed",
        )
        raise

    return {
        "message": (
            "Safety report uploaded and "
            "synchronized successfully."
        ),
        "filename": upload_result["filename"],
        "file_path": upload_result["file_path"],
        **import_result,
    }


# ============================================================
# UPLOAD HISTORY
# ============================================================

@router.get("/history")
def get_upload_history():
    """
    Return the twenty most recent upload-log records.
    """

    db = SessionLocal()

    try:
        rows = db.execute(
            text(
                """
                SELECT
                    report_type,
                    file_name,
                    uploaded_by,
                    status,
                    uploaded_at
                FROM public.upload_logs
                ORDER BY uploaded_at DESC
                LIMIT 20
                """
            )
        ).mappings().all()

        return [
            {
                "report_type": row["report_type"],
                "file_name": row["file_name"],
                "uploaded_by": row["uploaded_by"],
                "status": row["status"],
                "uploaded_at": str(
                    row["uploaded_at"]
                ),
            }
            for row in rows
        ]

    finally:
        db.close()