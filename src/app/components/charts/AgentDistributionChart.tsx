import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { useTickets } from '@/lib/contexts/TicketContext';
import { formatNumber } from '@/lib/utils';
import ChartWrapper from './ChartWrapper';

const COLORS = {
  default: '#8b5cf6', // purple-500
  dark: '#a78bfa',    // purple-400
};

const AgentDistributionChart: React.FC = () => {
  const { agentData, setFilters } = useTickets();
  
  // Limit to top 10 agents for better visualization
  const data = agentData
    ? agentData.slice(0, 10).map(item => ({
        name: item.label,
        value: item.count,
        percentage: item.percentage
      }))
    : [];
    
  const handleBarClick = (data: any) => {
    if (data && data.name) {
      setFilters({ agents: [data.name] });
    }
  };
  
  const downloadCSV = () => {
    if (!agentData) return;
    
    // Create CSV content
    const csvContent = [
      ['Agent', 'Ticket Count', 'Percentage'],
      ...agentData.map((entry) => [entry.label, entry.count, entry.percentage]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'agent_distribution.csv');
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
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 60, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis 
              type="number" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatNumber}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              width={80}
            />
            <Tooltip
              formatter={(value, name, props) => {
                if (name === 'value') {
                  return [formatNumber(value as number), 'Tickets'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `Agent: ${label}`}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
            <Bar 
              dataKey="value" 
              name="Ticket Count" 
              fill={COLORS.default} 
              fillOpacity={0.8}
              activeBar={{ fill: COLORS.dark, fillOpacity: 1 }}
              onClick={handleBarClick}
              cursor="pointer"
            >
              <LabelList 
                dataKey="value" 
                position="right" 
                fill="#6b7280" 
                fontSize={12} 
                formatter={formatNumber} 
                offset={5}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </>
  );
  
  return (
    <ChartWrapper 
      title="Tickets by Agent" 
      downloadAction={downloadCSV}
      footer="Click on a bar to filter by that agent"
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default AgentDistributionChart; 