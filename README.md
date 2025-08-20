# RAG API & Resume Generator

A comprehensive Retrieval Augmented Generation (RAG) application with integrated AI-powered resume generation capabilities.

## Features

### RAG System
- Upload and process PDF documents
- Intelligent document querying using AI
- Real-time chat interface for document Q&A
- Visualization of query results
- Document management and storage

### Resume Generator (NEW!)
- AI-powered professional resume creation
- Multiple input methods:
  - Text-based input
  - PDF upload and processing
  - Selection from existing documents
- Multiple professional templates:
  - Professional
  - Creative
  - Academic
  - Technical
- Resume improvement and enhancement features
- Download generated resumes

## Architecture

### Backend (FastAPI)
- Document processing with PyPDF2
- AI integration with Google Gemini Pro
- Vector embeddings with Sentence Transformers
- MongoDB for data persistence
- Cloudinary for file storage
- RESTful API endpoints

### Frontend (Next.js)
- Modern React-based dashboard
- Responsive UI with Tailwind CSS
- Real-time WebSocket communication
- Tabbed interface for RAG and Resume features
- File upload and management

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB
- Cloudinary account
- Google Gemini API key

### Environment Variables
Create a `.env` file in the backend directory:

```bash
MONGODB_URL=your_mongodb_connection_string
DB_NAME=pdf_query_system
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Installation

#### Backend Setup
```bash
cd rag_app/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd rag_app
npm install --legacy-peer-deps
npm run dev
```

## Usage

### RAG System
1. Upload PDF documents through the Data Sources panel
2. Use the Chat panel to query your documents
3. View visualizations and results in real-time

### Resume Generator
1. Navigate to the "Resume Generator" tab
2. Choose your preferred input method:
   - **Generate**: Enter your information manually
   - **From PDF**: Select from uploaded documents
   - **Upload**: Upload a new PDF file
3. Select a professional template
4. Generate your resume using AI
5. Use the "Improve" feature to enhance your resume
6. Download the final result

## API Endpoints

### RAG Endpoints
- `POST /api/v1/upload_pdf` - Upload PDF documents
- `POST /api/v1/query` - Query documents
- `GET /api/v1/pdfs` - List uploaded documents
- `GET /api/v1/history/{pdf_id}` - Get query history

### Resume Generator Endpoints
- `POST /api/v1/generate-resume` - Generate from text
- `POST /api/v1/generate-resume-from-pdf` - Generate from PDF
- `POST /api/v1/generate-resume-upload` - Generate from upload
- `POST /api/v1/improve-resume` - Improve existing resume
- `GET /api/v1/resume-templates` - Get available templates

## Technologies Used

### Backend
- FastAPI
- Google Generative AI (Gemini Pro)
- Sentence Transformers
- PyPDF2
- MongoDB with Motor
- Cloudinary
- Pydantic

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components
- WebSocket for real-time communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Documentation

- [Resume Generator Documentation](./RESUME_GENERATOR_DOCS.md)

---

Transform your documents into insights and your information into professional resumes with RAG API!
