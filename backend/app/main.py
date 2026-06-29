from fastapi import FastAPI
from app.routers.production import router as production_router
from app.routers.ai import router as ai_router
from app.routers.upload import router as upload_router
from app.routers.analytics import router as analytics_router
from app.routers.briefing import router as briefing_router

app = FastAPI(
    title="Mine Manager AI",
    version="0.1"
)

app.include_router(briefing_router)

app.include_router(upload_router)
app.include_router(analytics_router)

@app.get("/")
def root():
    return {"message": "Mine Manager AI is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/database")
def database():
    return {"database": "connected"}

app.include_router(
    production_router,
    prefix="/production",
    tags=["Production"]
)

app.include_router(
    ai_router,
    prefix="/ai",
    tags=["AI"]
)