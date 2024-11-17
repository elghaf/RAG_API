import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { DashboardPanel } from './DashboardPanel';
  
  interface TablesPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    tableData: any[];
  }
  
  export const TablesPanel = ({ isOpen, onToggle, tableData }: TablesPanelProps) => {
    if (!tableData.length) return null;
  
    const columns = Object.keys(tableData[0]);
  
    return (
      <DashboardPanel title="Data Table" isOpen={isOpen} onToggle={onToggle}>
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
              {tableData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {column === 'timestamp' 
                        ? new Date(row[column]).toLocaleString()
                        : row[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DashboardPanel>
    );
  };