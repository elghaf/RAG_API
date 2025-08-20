'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface ResumeData {
  personal_info: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  professional_summary?: string;
  work_experience: Array<{
    title?: string;
    company?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    responsibilities: string[];
  }>;
  education: Array<{
    degree?: string;
    institution?: string;
    location?: string;
    graduation_date?: string;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  certifications: Array<{
    name?: string;
    issuer?: string;
    date?: string;
  }>;
  projects: Array<{
    name?: string;
    description?: string;
    technologies: string[];
    url?: string;
  }>;
}

interface ResumeResponse {
  status: string;
  resume: ResumeData;
  formatted_text: string;
}

export const ResumePanel = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [userInput, setUserInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPdfId, setSelectedPdfId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<ResumeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [improvementRequest, setImprovementRequest] = useState('');
  const [availablePdfs, setAvailablePdfs] = useState<Array<{id: string, filename: string}>>([]);

  // Load available PDFs on component mount
  React.useEffect(() => {
    fetchAvailablePdfs();
  }, []);

  const fetchAvailablePdfs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/pdfs');
      if (response.ok) {
        const data = await response.json();
        setAvailablePdfs(data);
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    }
  };

  const generateResumeFromText = async () => {
    if (!userInput.trim()) {
      setError('Please enter your information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_data: userInput,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const data: ResumeResponse = await response.json();
      setGeneratedResume(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateResumeFromPdf = async () => {
    if (!selectedPdfId) {
      setError('Please select a PDF');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/generate-resume-from-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_id: selectedPdfId,
          template: selectedTemplate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume from PDF');
      }

      const data: ResumeResponse = await response.json();
      setGeneratedResume(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateResumeFromUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('template', selectedTemplate);

      const response = await fetch('http://localhost:8000/api/v1/generate-resume-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume from upload');
      }

      const data: ResumeResponse = await response.json();
      setGeneratedResume(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const improveResume = async () => {
    if (!generatedResume || !improvementRequest.trim()) {
      setError('Please provide improvement instructions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/improve-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_resume: generatedResume.resume,
          improvement_request: improvementRequest,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve resume');
      }

      const data: ResumeResponse = await response.json();
      setGeneratedResume(data);
      setImprovementRequest('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = () => {
    if (!generatedResume) return;

    const blob = new Blob([generatedResume.formatted_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Generator
        </CardTitle>
        <CardDescription>
          Generate professional resumes from your information or uploaded documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="from-pdf">From PDF</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="improve" disabled={!generatedResume}>Improve</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Resume Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="userInput">Your Information</Label>
                <Textarea
                  id="userInput"
                  placeholder="Enter your professional information, education, work experience, skills, etc. The more details you provide, the better your resume will be."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              <Button 
                onClick={generateResumeFromText} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Resume...
                  </>
                ) : (
                  'Generate Resume'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="from-pdf" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Resume Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pdf-select">Select PDF Document</Label>
                <Select value={selectedPdfId} onValueChange={setSelectedPdfId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a PDF" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePdfs.map((pdf) => (
                      <SelectItem key={pdf.id} value={pdf.id}>
                        {pdf.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateResumeFromPdf} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Resume...
                  </>
                ) : (
                  'Generate Resume from PDF'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Resume Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file-upload">Upload PDF</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button 
                onClick={generateResumeFromUpload} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Resume...
                  </>
                ) : (
                  'Generate Resume from Upload'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="improve" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="improvement">Improvement Instructions</Label>
                <Textarea
                  id="improvement"
                  placeholder="Describe how you'd like to improve your resume (e.g., 'Make it more technical', 'Add more action verbs', 'Focus on leadership experience')"
                  value={improvementRequest}
                  onChange={(e) => setImprovementRequest(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                onClick={improveResume} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Improving Resume...
                  </>
                ) : (
                  'Improve Resume'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {generatedResume && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Generated Resume
              </h3>
              <Button onClick={downloadResume} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                  {generatedResume.formatted_text}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};