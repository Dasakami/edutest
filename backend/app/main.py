from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import init_db
from .api import auth, tests, questions, results, users

app = FastAPI(
    title="Testing System API",
    description="API для системы тестирования знаний",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tests.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def root():
    return {"message": "Testing System API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}