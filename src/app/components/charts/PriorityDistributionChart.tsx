import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useTickets } from '@/lib/contexts/TicketContext';
import { formatNumber } from '@/lib/utils';
import ChartWrapper from './ChartWrapper';

// Colors for different priority levels
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical': return '#ef4444'; // red
    case 'high': return '#f97316'; // orange
    case 'medium': return '#f59e0b'; // amber
    case 'low': return '#10b981'; // green
    default: return '#3b82f6'; // blue
  }
};

const PriorityDistributionChart: React.FC = () => {
  const { priorityData, setFilters } = useTickets();

  const data = priorityData 
    ? priorityData.map(item => ({
        name: item.label,
        value: item.count,
        percentage: item.percentage
      }))
    : [];

  // Sort data by priority level
  const sortedData = React.useMemo(() => {
    const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
    return [...data].sort((a, b) => 
      priorityOrder.indexOf(a.name) - priorityOrder.indexOf(b.name)
    );
  }, [data]);

  const handleBarClick = (entry: any) => {
    if (entry && entry.name) {
      setFilters({ priorities: [entry.name] });
    }
  };
  
  const downloadCSV = () => {
    if (!priorityData) return;
    
    // Create CSV content
    const csvContent = [
      ['Priority', 'Ticket Count', 'Percentage'],
      ...priorityData.map((entry) => [entry.label, entry.count, entry.percentage]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'priority_distribution.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart content
  const chartContent = (
    <>
      {data.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for the selected filters</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <BarChart
            data={sortedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name, props) => [formatNumber(value as number), 'Tickets']}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
            <Bar 
              dataKey="value" 
              onClick={handleBarClick}
              cursor="pointer"
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getPriorityColor(entry.name)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </>
  );

  return (
    <ChartWrapper 
      title="Tickets by Priority" 
      downloadAction={downloadCSV}
      footer="Click on a bar to filter by that priority"
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default PriorityDistributionChart; 