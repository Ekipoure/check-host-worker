"""
Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Check-IP Worker API",
    description="Worker API for IP checking, ping, HTTP, DNS, and port checks",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Check-IP Worker API",
        "version": "1.0.0",
        "endpoints": {
            "ping": "/check-ping?host=<hostname>",
            "http": "/check-http?host=<url>",
            "tcp": "/check-tcp?host=<host:port>",
            "udp": "/check-udp?host=<host:port>",
            "dns": "/check-dns?host=<hostname>",
            "ip_info": "/ip-info?host=<ip_or_hostname>",
            "whois": "/whois?domain=<domain>",
            "subnet": "/subnet-calculator?input=<range_or_cidr>",
            "nodes": "/nodes/ips or /nodes/hosts"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    
    uvicorn.run(app, host=host, port=port)

