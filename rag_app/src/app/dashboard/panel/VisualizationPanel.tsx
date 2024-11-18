
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardPanel } from './DashboardPanel';

interface VisualizationPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  chartData: any[];
}

export const VisualizationPanel = ({ isOpen, onToggle, chartData }: VisualizationPanelProps) => {
  return (
    <DashboardPanel title="Visualization" isOpen={isOpen} onToggle={onToggle}>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            {Object.keys(chartData[0] || {})
              .filter(key => key !== 'timestamp')
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
      </div>
    </DashboardPanel>
  );
};