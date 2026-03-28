from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import predict, files, health
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Curator AI Backend", description="FastAPI REST Backend for Endee Vector DB", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(predict.router, tags=["Prediction"])
app.include_router(files.router, tags=["Files Management"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
