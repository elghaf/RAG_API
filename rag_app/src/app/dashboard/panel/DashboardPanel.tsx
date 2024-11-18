'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DashboardPanelProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export const DashboardPanel = ({ title, children, isOpen, onToggle }: DashboardPanelProps) => (
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