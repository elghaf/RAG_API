import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, BarChart, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DashboardPanel = ({ title, children, isOpen, onToggle }) => (
  <Card className="flex flex-col">
    <CardHeader className="cursor-pointer" onClick={onToggle}>
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg">{title}</CardTitle>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>
    </CardHeader>
    {isOpen && <CardContent>{children}</CardContent>}
  </Card>
);

const RagDashboard = () => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  
  // Panel visibility states
  const [visiblePanels, setVisiblePanels] = useState({
    visualization: true,
    tables: true,
    chat: true
  });

  // Toggle panel visibility
  const togglePanel = (panelName) => {
    setVisiblePanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };

  // Initialize WebSocket connection
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
      setError('WebSocket error: ' + error.message);
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

  const handleIncomingMessage = useCallback((data) => {
    setLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    if (data.type === 'data_update') {
      // Update chart data
      setChartData(prevData => {
        const newData = Object.entries(data.data).map(([timestamp, values]) => ({
          timestamp,
          ...values
        }));
        return [...prevData, ...newData].slice(-50);
      });
      // Update table data
      setTableData(prevData => {
        const newData = Object.entries(data.data).map(([timestamp, values]) => ({
          timestamp,
          ...values
        }));
        return [...prevData, ...newData];
      });
    }

    setMessages(prev => [...prev, {
      timestamp: new Date().toISOString(),
      content: data.answer || 'Update received',
      visualization: data.visualization,
      table: data.table
    }]);
  }, []);

  const sendQuery = useCallback(() => {
    if (!connected || !query.trim()) return;
    setLoading(true);
    setError(null);
    ws.send(query);
    setQuery('');
  }, [connected, query, ws]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Real-time RAG Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-4 flex-grow">
        {/* Visualization Panel */}
        <DashboardPanel 
          title="Real-time Visualization" 
          isOpen={visiblePanels.visualization}
          onToggle={() => togglePanel('visualization')}
        >
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        {/* Tables Panel */}
        <DashboardPanel 
          title="Data Tables" 
          isOpen={visiblePanels.tables}
          onToggle={() => togglePanel('tables')}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        {/* Chat Panel */}
        <DashboardPanel 
          title="Query & Chat" 
          isOpen={visiblePanels.chat}
          onToggle={() => togglePanel('chat')}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex-grow overflow-auto max-h-[300px] space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-gray-900">{msg.content}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your data..."
                disabled={!connected || loading}
                className="flex-grow"
              />
              <Button
                onClick={sendQuery}
                disabled={!connected || loading || !query.trim()}
              >
                <ChevronRight className="w-4 h-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
};

export default RagDashboard;