from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .services.rag_service import RAGService
from .db.mongodb import MongoDB
import cloudinary
from .config import settings
from .api.endpoints import pdf, query  # Add query import
# app/main.py or in an appropriate route file
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="PDF Query System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pdf.router, prefix="/api/v1", tags=["pdf"])
app.include_router(query.router, prefix="/api/v1", tags=["query"])  # Add query router



#@app.post("/upload")
#async def upload_file(files: list[UploadFile]):
#    for file in files:
#        # Handle each file (e.g., save, process, etc.)
#        contents = await file.read()  # Example: reading file contents
#        print(f"Uploaded file: {file.filename} with size {len(contents)} bytes")
#
#    return {"message": "Files uploaded successfully"}


# Register routes
@app.get("/")
async def root():
    return {"message": "Welcome to the PDF Query System API!"}

# Include routers
app.include_router(pdf.router, prefix="/api/v1", tags=["pdf"])
app.include_router(query.router, prefix="/api/v1", tags=["query"])  # Add query router

@app.on_event("startup")
async def startup_db_client():
    await MongoDB.connect_db()
    
    # Configure Cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET
    )
    
    # Create MongoDB indexes for queries collection
    await MongoDB.db.queries.create_index("pdf_id")
    await MongoDB.db.queries.create_index("created_at")

@app.on_event("shutdown")
async def shutdown_db_client():
    print("Shutting down PDF Query System API")

# WebSocket management
connected_clients = set()



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    rag_service = RAGService()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "query":
                response = await rag_service.process_query(
                    query=data["query"],
                    pdf_id=data.get("pdf_id")
                )
                
                await websocket.send_json({
                    "answer": response["answer"],
                    "visualizations": response["visualizations"]
                })
                
    except WebSocketDisconnect:
        print("Client disconnected")
