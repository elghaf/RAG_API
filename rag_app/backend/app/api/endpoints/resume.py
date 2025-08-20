# app/api/endpoints/resume.py
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from ...schemas.models import (
    ResumeGenerationRequest, 
    ResumeFromPDFRequest, 
    ResumeImprovementRequest, 
    ResumeResponse
)
from ...services.resume_service import resume_service
from ...db.mongodb import MongoDB
from bson import ObjectId
import requests
import logging

router = APIRouter()

@router.post("/generate-resume", response_model=ResumeResponse)
async def generate_resume_from_text(request: ResumeGenerationRequest):
    """Generate a resume from user-provided text data"""
    try:
        logging.info(f"Generating resume from text data with template: {request.template}")
        
        # Generate resume using the resume service
        result = await resume_service.generate_resume_from_text(
            user_data=request.user_data,
            template=request.template
        )
        
        return result
        
    except Exception as e:
        logging.error(f"Error generating resume from text: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating resume: {str(e)}"
        )

@router.post("/generate-resume-from-pdf", response_model=ResumeResponse)
async def generate_resume_from_pdf(request: ResumeFromPDFRequest):
    """Generate a resume from an uploaded PDF"""
    try:
        logging.info(f"Generating resume from PDF ID: {request.pdf_id}")
        
        # Validate PDF ID format
        try:
            pdf_id = ObjectId(request.pdf_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF ID format"
            )
        
        # Get PDF from MongoDB
        pdf = await MongoDB.db.pdfs.find_one({"_id": pdf_id})
        if not pdf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF not found"
            )
        
        # Download PDF content from Cloudinary
        try:
            pdf_response = requests.get(pdf['cloudinary_url'], stream=True)
            if pdf_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Could not download PDF from Cloudinary"
                )
            pdf_content = pdf_response.content
        except Exception as e:
            logging.error(f"Error downloading PDF: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error downloading PDF from Cloudinary"
            )
        
        # Generate resume from PDF content
        result = await resume_service.generate_resume_from_pdf(
            pdf_content=pdf_content,
            template=request.template
        )
        
        return result
        
    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logging.error(f"Error generating resume from PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating resume from PDF: {str(e)}"
        )

@router.post("/generate-resume-upload", response_model=ResumeResponse)
async def generate_resume_from_upload(
    file: UploadFile = File(...),
    template: str = "professional"
):
    """Generate a resume from a directly uploaded file"""
    try:
        logging.info(f"Generating resume from uploaded file: {file.filename}")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Generate resume from PDF content
        result = await resume_service.generate_resume_from_pdf(
            pdf_content=file_content,
            template=template
        )
        
        return result
        
    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logging.error(f"Error generating resume from upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating resume from upload: {str(e)}"
        )

@router.post("/improve-resume", response_model=ResumeResponse)
async def improve_resume(request: ResumeImprovementRequest):
    """Improve an existing resume based on specific feedback"""
    try:
        logging.info("Improving existing resume")
        
        # Generate improved resume
        result = await resume_service.improve_resume(
            current_resume=request.current_resume,
            improvement_request=request.improvement_request
        )
        
        return result
        
    except Exception as e:
        logging.error(f"Error improving resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error improving resume: {str(e)}"
        )

@router.get("/resume-templates")
async def get_resume_templates():
    """Get available resume templates"""
    try:
        templates = [
            {
                "id": "professional",
                "name": "Professional",
                "description": "Clean, professional layout suitable for corporate environments"
            },
            {
                "id": "creative",
                "name": "Creative",
                "description": "Modern, creative design for design and creative roles"
            },
            {
                "id": "academic",
                "name": "Academic",
                "description": "Traditional format ideal for academic and research positions"
            },
            {
                "id": "technical",
                "name": "Technical",
                "description": "Optimized for technical and engineering roles"
            }
        ]
        
        return {
            "status": "success",
            "templates": templates
        }
        
    except Exception as e:
        logging.error(f"Error getting resume templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting resume templates: {str(e)}"
        )