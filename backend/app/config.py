from sqlalchemy import text
from .database import engine

def test_connection():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT NOW()"))
        return result.fetchone()