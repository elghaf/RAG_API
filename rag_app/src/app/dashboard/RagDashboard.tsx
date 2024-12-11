'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { DataSourcesPanel } from './panel/DataSourcesPanel';
import { VisualizationPanel } from './panel/VisualizationPanel';
import { TablesPanel } from './panel/TablesPanel';
import { ChatPanel } from './panel/ChatPanel';


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

  const togglePanel = (
    panelName: 'datasource' | 'visualization' | 'tables' | 'chat'
  ) => {
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
      ...(typeof values === 'object' && values !== null ? values : {}),
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
      if (error instanceof Error) {
        setError(`File upload failed: ${error.toString()}`);
      } else {
        setError('File upload failed: Unknown error');
      }
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
    <div className="flex flex-col h-screen w-full bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100">
      {/* Header Section */}
      <header className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-200 to-indigo-300 text-gray-800 shadow-lg">
        <h1 className="text-3xl font-bold">Real-time RAG Dashboard</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
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
        <div className="flex h-full">
          {/* Left Side Panels */}
          <div className="w-2/5 flex flex-col gap-6">
            {visiblePanels.datasource && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-lg p-6 flex flex-col text-gray-800">
                <DataSourcesPanel
                  isOpen={visiblePanels.datasource}
                  onToggle={() => togglePanel('datasource')}
                  files={files}
                  onFileUpload={handleFileUpload}
                  onDatabaseConnect={handleDatabaseConnect}
                />
              </div>
            )}
            {visiblePanels.visualization && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-lg p-6 flex flex-col text-gray-800">
                <VisualizationPanel
                  isOpen={visiblePanels.visualization}
                  onToggle={() => togglePanel('visualization')}
                  chartData={chartData}
                />
              </div>
            )}
            {visiblePanels.tables && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-lg p-6 flex flex-col text-gray-800">
                <TablesPanel
                  isOpen={visiblePanels.tables}
                  onToggle={() => togglePanel('tables')}
                  tableData={tableData}
                />
              </div>
            )}
          </div>
          {/* Right Side Chat Panel */}
          {visiblePanels.chat && (
            <div className="w-3/5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-lg p-6 flex flex-col text-gray-800">
              <ChatPanel
                isOpen={visiblePanels.chat}
                onToggle={() => togglePanel('chat')}
                messages={messages}
                sendMessage={handleSendMessage}
                loading={loading}
                connected={connected}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 bg-gradient-to-r from-purple-200 to-indigo-300 text-gray-800 text-center shadow-lg">
        © {new Date().getFullYear()} RAG Dashboard - All rights reserved.
      </footer>
    </div>
  );
};

export default RagDashboard;
