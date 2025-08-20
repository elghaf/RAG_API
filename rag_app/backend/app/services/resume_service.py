# app/services/resume_service.py
from typing import Dict, Any, Optional, List
import google.generativeai as genai
from ..config import settings
from ..utils.pdf_processor import PDFProcessor
import json
import re

class ResumeService:
    def __init__(self):
        # Initialize Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')
        self.pdf_processor = PDFProcessor()
        
    async def generate_resume_from_text(self, user_data: str, template: str = "professional") -> Dict[str, Any]:
        """Generate a resume from user-provided text data"""
        try:
            prompt = f"""You are a professional resume writer. Based on the following information about a person, create a well-structured, professional resume.

User Information:
{user_data}

Template Style: {template}

Instructions:
1. Create a comprehensive resume with the following sections: Personal Info, Professional Summary, Work Experience, Education, Skills, and any other relevant sections
2. Format the output as structured JSON with the following schema:
{{
    "personal_info": {{
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "City, State",
        "linkedin": "LinkedIn URL (if provided)",
        "portfolio": "Portfolio URL (if provided)"
    }},
    "professional_summary": "A compelling professional summary paragraph",
    "work_experience": [
        {{
            "title": "Job Title",
            "company": "Company Name",
            "location": "City, State",
            "start_date": "MM/YYYY",
            "end_date": "MM/YYYY or Present",
            "responsibilities": ["Responsibility 1", "Responsibility 2", ...]
        }}
    ],
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "Institution Name",
            "location": "City, State",
            "graduation_date": "MM/YYYY",
            "gpa": "GPA (if provided)"
        }}
    ],
    "skills": {{
        "technical": ["skill1", "skill2", ...],
        "soft": ["skill1", "skill2", ...],
        "languages": ["language1", "language2", ...]
    }},
    "certifications": [
        {{
            "name": "Certification Name",
            "issuer": "Issuing Organization",
            "date": "MM/YYYY"
        }}
    ],
    "projects": [
        {{
            "name": "Project Name",
            "description": "Project description",
            "technologies": ["tech1", "tech2", ...],
            "url": "Project URL (if available)"
        }}
    ]
}}

3. If information is missing, leave the field empty or null
4. Make sure all dates are in MM/YYYY format
5. Use action verbs for responsibilities and achievements
6. Tailor the content to be professional and compelling

Generate the resume:"""

            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            resume_data = self._extract_json_from_response(response.text)
            
            return {
                "status": "success",
                "resume": resume_data,
                "formatted_text": self._format_resume_as_text(resume_data)
            }
            
        except Exception as e:
            raise Exception(f"Error generating resume: {str(e)}")
    
    async def generate_resume_from_pdf(self, pdf_content: bytes, template: str = "professional") -> Dict[str, Any]:
        """Generate a resume from uploaded PDF content"""
        try:
            # Extract text from PDF
            pdf_text = await self.pdf_processor.extract_text_from_pdf(pdf_content)
            
            # Generate resume from extracted text
            return await self.generate_resume_from_text(pdf_text, template)
            
        except Exception as e:
            raise Exception(f"Error generating resume from PDF: {str(e)}")
    
    async def improve_resume(self, current_resume: Dict[str, Any], improvement_request: str) -> Dict[str, Any]:
        """Improve an existing resume based on specific requests"""
        try:
            prompt = f"""You are a professional resume writer. Here is a current resume in JSON format:

Current Resume:
{json.dumps(current_resume, indent=2)}

Improvement Request:
{improvement_request}

Instructions:
1. Make the requested improvements to the resume
2. Maintain the same JSON structure
3. Ensure all improvements are professional and relevant
4. Return the improved resume in the same JSON format

Generate the improved resume:"""

            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            improved_resume = self._extract_json_from_response(response.text)
            
            return {
                "status": "success",
                "resume": improved_resume,
                "formatted_text": self._format_resume_as_text(improved_resume)
            }
            
        except Exception as e:
            raise Exception(f"Error improving resume: {str(e)}")
    
    def _extract_json_from_response(self, response_text: str) -> Dict[str, Any]:
        """Extract JSON from AI response"""
        try:
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            else:
                # If no JSON found, create a basic structure
                return {
                    "personal_info": {"name": "Unable to extract"},
                    "professional_summary": response_text[:500] + "...",
                    "work_experience": [],
                    "education": [],
                    "skills": {"technical": [], "soft": [], "languages": []},
                    "certifications": [],
                    "projects": []
                }
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "personal_info": {"name": "Parse Error"},
                "professional_summary": "Error parsing resume data",
                "work_experience": [],
                "education": [],
                "skills": {"technical": [], "soft": [], "languages": []},
                "certifications": [],
                "projects": []
            }
    
    def _format_resume_as_text(self, resume_data: Dict[str, Any]) -> str:
        """Format resume data as readable text"""
        try:
            formatted = []
            
            # Personal Info
            personal = resume_data.get("personal_info", {})
            if personal.get("name"):
                formatted.append(f"# {personal['name']}")
                formatted.append("")
                
                contact_info = []
                if personal.get("email"):
                    contact_info.append(f"Email: {personal['email']}")
                if personal.get("phone"):
                    contact_info.append(f"Phone: {personal['phone']}")
                if personal.get("location"):
                    contact_info.append(f"Location: {personal['location']}")
                if personal.get("linkedin"):
                    contact_info.append(f"LinkedIn: {personal['linkedin']}")
                
                formatted.append(" | ".join(contact_info))
                formatted.append("")
            
            # Professional Summary
            if resume_data.get("professional_summary"):
                formatted.append("## Professional Summary")
                formatted.append(resume_data["professional_summary"])
                formatted.append("")
            
            # Work Experience
            work_exp = resume_data.get("work_experience", [])
            if work_exp:
                formatted.append("## Work Experience")
                for job in work_exp:
                    formatted.append(f"### {job.get('title', 'N/A')} - {job.get('company', 'N/A')}")
                    if job.get("location"):
                        formatted.append(f"*{job['location']}*")
                    if job.get("start_date") or job.get("end_date"):
                        date_range = f"{job.get('start_date', 'N/A')} - {job.get('end_date', 'Present')}"
                        formatted.append(f"*{date_range}*")
                    
                    responsibilities = job.get("responsibilities", [])
                    if responsibilities:
                        for resp in responsibilities:
                            formatted.append(f"• {resp}")
                    formatted.append("")
            
            # Education
            education = resume_data.get("education", [])
            if education:
                formatted.append("## Education")
                for edu in education:
                    formatted.append(f"### {edu.get('degree', 'N/A')}")
                    formatted.append(f"*{edu.get('institution', 'N/A')}*")
                    if edu.get("graduation_date"):
                        formatted.append(f"*Graduated: {edu['graduation_date']}*")
                    if edu.get("gpa"):
                        formatted.append(f"*GPA: {edu['gpa']}*")
                    formatted.append("")
            
            # Skills
            skills = resume_data.get("skills", {})
            if any(skills.values()):
                formatted.append("## Skills")
                if skills.get("technical"):
                    formatted.append(f"**Technical:** {', '.join(skills['technical'])}")
                if skills.get("soft"):
                    formatted.append(f"**Soft Skills:** {', '.join(skills['soft'])}")
                if skills.get("languages"):
                    formatted.append(f"**Languages:** {', '.join(skills['languages'])}")
                formatted.append("")
            
            # Certifications
            certifications = resume_data.get("certifications", [])
            if certifications:
                formatted.append("## Certifications")
                for cert in certifications:
                    cert_line = cert.get('name', 'N/A')
                    if cert.get('issuer'):
                        cert_line += f" - {cert['issuer']}"
                    if cert.get('date'):
                        cert_line += f" ({cert['date']})"
                    formatted.append(f"• {cert_line}")
                formatted.append("")
            
            # Projects
            projects = resume_data.get("projects", [])
            if projects:
                formatted.append("## Projects")
                for project in projects:
                    formatted.append(f"### {project.get('name', 'N/A')}")
                    if project.get('description'):
                        formatted.append(project['description'])
                    if project.get('technologies'):
                        formatted.append(f"**Technologies:** {', '.join(project['technologies'])}")
                    if project.get('url'):
                        formatted.append(f"**URL:** {project['url']}")
                    formatted.append("")
            
            return "\n".join(formatted)
            
        except Exception as e:
            return f"Error formatting resume: {str(e)}"

# Create instance
resume_service = ResumeService()