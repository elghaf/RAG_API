import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { File, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatabaseDialog } from './DatabaseDialog';
import { DashboardPanel } from './DashboardPanel';

interface DataSourcesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  files: File[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDatabaseConnect: (config: any) => void;
}

export const DataSourcesPanel = ({
  isOpen,
  onToggle,
  files,
  onFileUpload,
  onDatabaseConnect
}: DataSourcesPanelProps) => {
  return (
    <DashboardPanel title="Data Sources" isOpen={isOpen} onToggle={onToggle}>
      <div className="space-y-4">
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <File className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
              </DialogHeader>
              <Input
                type="file"
                multiple
                onChange={onFileUpload}
                className="mt-4"
              />
            </DialogContent>
          </Dialog>

          <DatabaseDialog onDatabaseConnect={onDatabaseConnect} />
        </div>

        {/* Display connected data sources */}
        <div className="space-y-2">
          {files.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Uploaded Files:</h3>
              <ul className="list-disc pl-5">
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </DashboardPanel>
  );
};