# app/schemas/models.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Pydantic models for request and response payloads
class PDFMetadata(BaseModel):
    id: str
    filename: str
    cloudinary_url: str
    cloudinary_public_id: str
    file_size: int
    created_at: datetime
    format: str

class QueryRequest(BaseModel):
    pdf_id: str
    query: str

class QueryResponse(BaseModel):
    id: str
    pdf_id: str
    query: str
    response: str
    created_at: datetime

# Resume models
class PersonalInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

class WorkExperience(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    responsibilities: List[str] = []

class Education(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    location: Optional[str] = None
    graduation_date: Optional[str] = None
    gpa: Optional[str] = None

class Skills(BaseModel):
    technical: List[str] = []
    soft: List[str] = []
    languages: List[str] = []

class Certification(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None

class Project(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = []
    url: Optional[str] = None

class ResumeData(BaseModel):
    personal_info: PersonalInfo
    professional_summary: Optional[str] = None
    work_experience: List[WorkExperience] = []
    education: List[Education] = []
    skills: Skills
    certifications: List[Certification] = []
    projects: List[Project] = []

class ResumeGenerationRequest(BaseModel):
    user_data: str
    template: Optional[str] = "professional"

class ResumeFromPDFRequest(BaseModel):
    pdf_id: str
    template: Optional[str] = "professional"

class ResumeImprovementRequest(BaseModel):
    current_resume: Dict[str, Any]
    improvement_request: str

class ResumeResponse(BaseModel):
    status: str
    resume: Dict[str, Any]
    formatted_text: str