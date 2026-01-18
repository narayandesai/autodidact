from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db_and_tables
from app.routers import topics, resources

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan, title="Autodidact API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topics.router)
app.include_router(resources.router)


@app.get("/")
def read_root():
    return {"message": "Autodidact API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
