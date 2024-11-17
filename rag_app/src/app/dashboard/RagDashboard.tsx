'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { DataSourcesPanel } from './DataSourcesPanel';
import { VisualizationPanel } from './VisualizationPanel';
import { TablesPanel } from './TablesPanel';
import { ChatPanel } from './ChatPanel';

const RagDashboard = () => {
  // State declarations (unchanged for logic)
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [visiblePanels, setVisiblePanels] = useState({
    datasource: true,
    visualization: true,
    tables: true,
    chat: true,
  });

  const togglePanel = (panelName: string) => {
    setVisiblePanels((prev) => ({
      ...prev,
      [panelName]: !prev[panelName],
    }));
  };

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8000/ws');
    websocket.onopen = () => {
      setConnected(true);
      setError(null);
    };
    websocket.onclose = () => {
      setConnected(false);
      setError('Connection lost. Trying to reconnect...');
    };
    websocket.onerror = (error) => {
      setError(`WebSocket error: ${error.toString()}`);
    };
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleIncomingMessage(data);
    };
    setWs(websocket);
    return () => {
      websocket.close();
    };
  }, []);

  const handleIncomingMessage = useCallback((data: any) => {
    setLoading(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    if (data.type === 'data_update') {
      updateData(data.data);
    }
    setMessages((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        content: data.answer || 'Update received',
        visualization: data.visualization,
        table: data.table,
      },
    ]);
  }, []);

  const updateData = (data: any) => {
    const newData = Object.entries(data).map(([timestamp, values]) => ({
      timestamp,
      ...values,
    }));
    setChartData((prevData) => [...prevData, ...newData].slice(-50));
    setTableData((prevData) => [...prevData, ...newData]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const uploadedFiles = Array.from(event.target.files);
    setFiles((prev) => [...prev, ...uploadedFiles]);
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append('files', file));
    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setError(`File upload failed: ${error.toString()}`);
    }
  };

  const handleDatabaseConnect = (config: any) => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'connect_database', config }));
  };

  const handleSendMessage = (message: string) => {
    if (!ws || !connected || !message.trim()) return;
    setLoading(true);
    setError(null);
    ws.send(message);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-b from-blue-50 via-white to-blue-100">
      {/* Header Section */}
      <header className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Real-time RAG Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${connected ? 'bg-green-300' : 'bg-red-400'}`} />
          <span className="text-lg font-medium">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="text-lg">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-full">
          {/* Panels */}
          <div className={`col-span-1 bg-white rounded-lg shadow-md p-6 flex flex-col ${visiblePanels.datasource ? '' : 'hidden'}`}>
            <DataSourcesPanel
              isOpen={visiblePanels.datasource}
              onToggle={() => togglePanel('datasource')}
              files={files}
              onFileUpload={handleFileUpload}
              onDatabaseConnect={handleDatabaseConnect}
            />
          </div>
          <div className={`col-span-1 bg-white rounded-lg shadow-md p-6 flex flex-col ${visiblePanels.visualization ? '' : 'hidden'}`}>
            <VisualizationPanel
              isOpen={visiblePanels.visualization}
              onToggle={() => togglePanel('visualization')}
              chartData={chartData}
            />
          </div>
          <div className={`col-span-1 bg-white rounded-lg shadow-md p-6 flex flex-col ${visiblePanels.tables ? '' : 'hidden'}`}>
            <TablesPanel
              isOpen={visiblePanels.tables}
              onToggle={() => togglePanel('tables')}
              tableData={tableData}
            />
          </div>
          <div className={`col-span-1 bg-white rounded-lg shadow-md p-6 flex flex-col ${visiblePanels.chat ? '' : 'hidden'}`}>
            <ChatPanel
              isOpen={visiblePanels.chat}
              onToggle={() => togglePanel('chat')}
              messages={messages}
              onSendMessage={handleSendMessage}
              loading={loading}
              connected={connected}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center shadow-lg">
        © {new Date().getFullYear()} RAG Dashboard - All rights reserved.
      </footer>
    </div>
  );
};

export default RagDashboard;
