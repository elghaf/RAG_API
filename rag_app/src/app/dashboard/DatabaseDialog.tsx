'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DatabaseDialogProps {
  onDatabaseConnect: (config: any) => void;
}

export const DatabaseDialog = ({ onDatabaseConnect }: DatabaseDialogProps) => {
  const [dbConfig, setDbConfig] = useState({
    type: 'postgresql',
    url: '',
    name: ''
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Database className="w-4 h-4 mr-2" />
          Connect Database
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Database Connection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Select onValueChange={(value) => setDbConfig(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select database type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="mongodb">MongoDB</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Connection URL"
            value={dbConfig.url}
            onChange={(e) => setDbConfig(prev => ({ ...prev, url: e.target.value }))}
          />
          <Input
            placeholder="Database Name"
            value={dbConfig.name}
            onChange={(e) => setDbConfig(prev => ({ ...prev, name: e.target.value }))}
          />
          <Button onClick={() => onDatabaseConnect(dbConfig)}>Connect</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};