from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ai_settings, auth, health, leads

app = FastAPI(title="Telegram AI Sales Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(ai_settings.router)
app.include_router(leads.router)
