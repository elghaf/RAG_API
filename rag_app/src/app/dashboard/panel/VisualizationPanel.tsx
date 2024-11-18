import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie } from 'recharts';
import { DashboardPanel } from './DashboardPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VisualizationData {
  type: 'line' | 'bar' | 'pie' | 'table';
  data: any[];
  title: string;
  description?: string;
}

interface VisualizationPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  visualizations: VisualizationData[];
}

export const VisualizationPanel = ({ isOpen, onToggle, visualizations }: VisualizationPanelProps) => {
  const [activeTab, setActiveTab] = useState<string>("0");

  const renderVisualization = (visualization: VisualizationData) => {
    switch (visualization.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visualization.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {Object.keys(visualization.data[0] || {})
                .filter(key => key !== 'name')
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={`hsl(${index * 45}, 70%, 50%)`}
                    dot={false}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={visualization.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {Object.keys(visualization.data[0] || {})
                .filter(key => key !== 'name')
                .map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={`hsl(${index * 45}, 70%, 50%)`}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={visualization.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
        const columns = Object.keys(visualization.data[0] || {});
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>
                      {column.charAt(0).toUpperCase() + column.slice(1)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visualization.data.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column}>{row[column]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
    }
  };

  return (
    <DashboardPanel title="Visualizations" isOpen={isOpen} onToggle={onToggle}>
      {(visualizations || []).length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {visualizations.map((viz, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {viz.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {visualizations.map((visualization, index) => (
            <TabsContent key={index} value={index.toString()}>
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <h3 className="font-semibold">{visualization.title}</h3>
                  {visualization.description && (
                    <p className="text-sm text-gray-500">{visualization.description}</p>
                  )}
                </div>
                {renderVisualization(visualization)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          No visualizations available
        </div>
      )}
    </DashboardPanel>
  );
};