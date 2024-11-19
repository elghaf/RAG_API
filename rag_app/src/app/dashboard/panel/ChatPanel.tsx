'use client';
import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardPanel } from './DashboardPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import VisualizationPanel from './VisualizationPanel';

interface Message {
  timestamp: string;
  content: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  url: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: Message[];
  loading: boolean;
  connected: boolean;
}

export const ChatPanel = ({
  isOpen,
  onToggle,
  messages,
  loading,
  connected,
}: ChatPanelProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>(messages || []);
  const [isLoading, setIsLoading] = useState(loading);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [snapshotData, setSnapshotData] = useState<string | null>(null);

  // Fetch the list of uploaded PDFs
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
        setChatMessages((prevMessages) => [
          ...prevMessages,
          {
            timestamp: new Date().toISOString(),
            content: `Error fetching uploaded files: ${(error as Error).message}`,
          },
        ]);
      }
    };

    fetchUploadedFiles();
  }, []);

  // Fetch query history when a PDF is selected
  useEffect(() => {
    if (selectedFile) {
      fetchQueryHistory(selectedFile.id);
    }
  }, [selectedFile]);

  const fetchQueryHistory = async (pdfId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/history/${pdfId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch query history.');
      }
      const history = await response.json();

      // Add history messages to the chat
      const historyMessages = history.map((entry: any) => ({
        timestamp: entry.created_at,
        content: `Query: ${entry.query}\nResponse: ${entry.response}`,
      }));
      setChatMessages(historyMessages);
    } catch (error) {
      console.error('Error fetching query history:', error);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          timestamp: new Date().toISOString(),
          content: `Error fetching query history: ${(error as Error).message}`,
        },
      ]);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedFile) {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          timestamp: new Date().toISOString(),
          content: 'Error: No PDF selected for querying. Please select a PDF.',
        },
      ]);
      return;
    }

    if (!message.trim()) {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          timestamp: new Date().toISOString(),
          content: 'Error: Query message cannot be empty.',
        },
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_id: selectedFile.id, query: message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const result = await response.json();

      // Fetch the snapshot for the query
      const snapshotResponse = await fetch(
        `http://localhost:8000/api/v1/snapshot/${selectedFile.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: message }),
        }
      );
      const snapshotData = await snapshotResponse.json(); // Assuming it returns an image URL or base64 string

      // Update visualization data
      setSnapshotData(snapshotData.imageUrl || snapshotData.base64Data);

      // Add the user query and server response to chat messages
      const newMessages = [
        ...chatMessages,
        {
          timestamp: new Date().toISOString(),
          content: `User: ${message}`,
        },
        {
          timestamp: new Date().toISOString(),
          content: `Response: ${result.response || 'No response received from the server.'}`,
        },
      ];
      setChatMessages(newMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          timestamp: new Date().toISOString(),
          content: `Error: Unable to process your query. ${(error as Error).message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <DashboardPanel title="Chat" isOpen={isOpen} onToggle={onToggle}>
      <div className="flex flex-col h-[600px]">
        {/* PDF Selection */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Select a PDF to Chat With:</h3>
          {uploadedFiles.length > 0 ? (
            <ul className="list-disc pl-5">
              {uploadedFiles.map((file) => (
                <li key={file.id}>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="selectedFile"
                      value={file.id}
                      onChange={() => setSelectedFile(file)}
                      checked={selectedFile?.id === file.id}
                    />
                    <span>{file.filename}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No PDFs available. Please upload PDFs first.</p>
          )}
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-grow mb-4 p-4 border rounded-md">
          {chatMessages.map((message, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm text-gray-600 mb-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
              Processing...
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={!connected || isLoading || !selectedFile}
          />
          <Button
            type="submit"
            disabled={!connected || isLoading || !inputMessage.trim() || !selectedFile}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Visualization Panel */}
      <VisualizationPanel selectedPage={selectedFile?.id} snapshotData={snapshotData} />
    </DashboardPanel>
  );
};

const VisualizationPanel = ({ selectedPage, snapshotData }) => {
  return (
    <div className="visualization-panel">
      <h2>Visualization</h2>
      <div className="visualization-content">
        {snapshotData ? (
          <img
            src={snapshotData}
            alt="PDF Snapshot"
            className="max-w-full max-h-[400px] rounded-md border"
          />
        ) : (
          'No snapshot available. Please make a query to generate a snapshot.'
        )}
      </div>
    </div>
  );
};
