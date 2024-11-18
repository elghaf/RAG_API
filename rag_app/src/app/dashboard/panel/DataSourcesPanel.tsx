'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { File as FileIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DashboardPanel } from './DashboardPanel';

interface DataSourcesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  files: File[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface UploadedFile {
  id: string;
  filename: string;
  url: string;
}

export const DataSourcesPanel = ({
  isOpen,
  onToggle,
  files,
  onFileUpload,
}: DataSourcesPanelProps) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const fetchUploadedFiles = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/pdfs');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch uploaded files: ${errorText}`);
        }
        const files = await response.json();
        setUploadedFiles(
          files.map((file: any) => ({
            id: file.id,
            filename: file.filename,
            url: file.cloudinary_url || file.url,
          }))
        );
      } catch (error) {
        console.error('Error fetching uploaded files:', error);
      }
    };

    fetchUploadedFiles();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const uploadedFiles = Array.from(event.target.files);
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append('file', file));

    try {
      setUploading(true);
      setMessage(null);

      const response = await fetch('http://localhost:8000/api/v1/upload_pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();
      setMessage('Files uploaded successfully!');
      console.log('File uploaded successfully:', result);

      const newFile: UploadedFile = {
        id: result.data.pdf_id,
        filename: result.data.pdf_metadata.filename,
        url: result.data.pdf_metadata.cloudinary_url,
      };

      setUploadedFiles((prevFiles) => [...prevFiles, newFile]);
    } catch (error) {
      console.error(`File upload failed: ${error}`);
      setMessage(`File upload failed: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardPanel title="Data Sources" isOpen={isOpen} onToggle={onToggle}>
      <div className="space-y-4">
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={uploading}>
                <FileIcon className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
              </DialogHeader>
              <Input
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleFileUpload}
                className="mt-4"
                disabled={uploading}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {uploadedFiles.length > 0 ? (
            <div>
              <h3 className="font-medium mb-2">Uploaded Files:</h3>
              <ul className="list-disc pl-5">
                {uploadedFiles.map((file) => (
                  <li key={file.id}>
                    <span>{file.filename}</span>
                    <div className="mt-2">
                      <iframe
                        src={file.url}
                        title={file.filename}
                        width="100%"
                        height="400"
                        className="border rounded"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No files uploaded yet.</p>
          )}
        </div>

        {message && <p className="mt-4 text-green-500">{message}</p>}
      </div>
    </DashboardPanel>
  );
};
