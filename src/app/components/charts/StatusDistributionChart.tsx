import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTickets } from '@/lib/contexts/TicketContext';
import { TicketAggregate } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import ChartWrapper from './ChartWrapper';

// Colors for different statuses
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return '#3b82f6'; // blue
    case 'in progress':
      return '#8b5cf6'; // purple
    case 'resolved':
      return '#10b981'; // green
    case 'closed':
      return '#6b7280'; // gray
    case 'reopened':
      return '#f59e0b'; // amber
    case 'on hold':
      return '#f97316'; // orange
    case 'pending':
      return '#0ea5e9'; // sky blue
    default:
      return '#d1d5db'; // light gray for unknown status
  }
};

const StatusDistributionChart: React.FC = () => {
  const { statusData = [] } = useTickets();
  
  const handlePieClick = (data: TicketAggregate) => {
    const status = data.label;
    // Add your filter logic here
    console.log(`Setting filter for status: ${status}`);
  };

  const downloadCSV = () => {
    if (!statusData || statusData.length === 0) return;
    
    // Create CSV content
    const csvContent = [
      ['Status', 'Count', 'Percentage'],
      ...statusData.map((entry: TicketAggregate) => [
        entry.label,
        entry.count,
        `${entry.percentage?.toFixed(2) ?? '0.00'}%`
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ticket_status_distribution.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotalCount = (): number => {
    return statusData.reduce((sum: number, item: TicketAggregate) => sum + item.count, 0);
  };

  const chartContent = (
    <>
      {!statusData || statusData.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No status data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              nameKey="label"
              label={({ label, percent }: { label: string; percent: number }) => `${label}: ${(percent * 100).toFixed(0)}%`}
              onClick={handlePieClick}
            >
              {statusData.map((entry: TicketAggregate, index: number) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.label)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} tickets (${props.payload.percentage?.toFixed(2) ?? '0.00'}%)`,
                'Count'
              ]}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </>
  );

  return (
    <ChartWrapper
      title="Ticket Status Distribution"
      downloadAction={downloadCSV}
      footer="Shows distribution of tickets by status"
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default StatusDistributionChart; 