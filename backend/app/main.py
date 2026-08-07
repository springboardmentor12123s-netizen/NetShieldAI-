from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import auth
from routers import auth, traffic, ai, alerts
# Initialize the FastAPI app
app = FastAPI(
    title="NetShield AI",
    description="AI-powered Network Anomaly Detection & Threat Monitoring System",
    version="1.0.0"
)
app.include_router(traffic.router, prefix="/api/traffic", tags=["Network Monitoring"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Threat Detection"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alert Management"])

# Create database tables on startup
models.Base.metadata.create_all(bind=engine)

# Configure CORS (Cross-Origin Resource Sharing)
# This allows our Next.js frontend to communicate with this backend later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, we will restrict this to our frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint to test if the server is running
@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "NetShield AI",
        "message": "Cybersecurity threat monitoring active."
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}