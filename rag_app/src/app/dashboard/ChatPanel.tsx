import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardPanel } from './DashboardPanel';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  timestamp: string;
  content: string;
  visualization?: any;
  table?: any;
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  loading: boolean;
  connected: boolean;
}

export const ChatPanel = ({
  isOpen,
  onToggle,
  messages,
  onSendMessage,
  loading,
  connected
}: ChatPanelProps) => {
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <DashboardPanel title="Chat" isOpen={isOpen} onToggle={onToggle}>
      <div className="flex flex-col h-[400px]">
        <ScrollArea className="flex-grow mb-4 p-4 border rounded-md">
          {messages.map((message, index) => (
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
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
              Processing...
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={!connected || loading}
          />
          <Button 
            type="submit" 
            disabled={!connected || loading || !inputMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </DashboardPanel>
  );
};