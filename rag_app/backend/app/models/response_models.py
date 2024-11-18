from pydantic import BaseModel
from typing import List, Optional

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float

class UploadResponse(BaseModel):
    success: bool
    document_id: str
    message: str

class Document(BaseModel):
    id: str
    filename: str
    content: str
    embedding: List[float]
    created_at: str