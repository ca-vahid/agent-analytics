"use client";

import React, { useState, useContext, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTickets } from '@/lib/contexts/TicketContext';
import { formatDate, formatNumber } from '@/lib/utils';
import ChartWrapper from './ChartWrapper';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

const TimeSeriesChart: React.FC = () => {
  const { timeseriesData } = useTickets();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Listen for fullscreen changes from the parent ChartWrapper
  // We'll use a simple trick with ResizeObserver to detect when we're in fullscreen
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Check if the element's width is significantly larger than normal
        // This would indicate we're in fullscreen mode
        setIsFullscreen(entry.contentRect.width > 1000);
      }
    });
    
    observer.observe(chartContainerRef.current);
    
    return () => {
      if (chartContainerRef.current) {
        observer.unobserve(chartContainerRef.current);
      }
    };
  }, []);

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (!timeseriesData) return [];

    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        return timeseriesData;
    }

    return timeseriesData.filter(item => new Date(item.date) >= cutoffDate);
  }, [timeseriesData, timeRange]);

  const downloadCSV = () => {
    if (!filteredData) return;
    
    // Create CSV content
    const csvContent = [
      ['Date', 'Created', 'Resolved'],
      ...filteredData.map((entry) => [
        formatDate(entry.date), 
        entry.created, 
        entry.resolved
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ticket_timeseries_${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Time range selector component
  const TimeRangeSelector = () => (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm text-gray-600 dark:text-gray-400">Time range:</span>
      <div className="flex space-x-1">
        {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-2 py-1 text-xs rounded ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {range === 'all' ? 'All time' : range}
          </button>
        ))}
      </div>
    </div>
  );

  // Chart content
  const chartContent = (
    <div ref={chartContainerRef} className="w-full h-full">
      <TimeRangeSelector />
      {filteredData.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for the selected time range</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={isFullscreen ? 600 : 300}>
          <LineChart
            data={filteredData}
            margin={
              isFullscreen 
                ? { top: 10, right: 60, left: 20, bottom: 10 } 
                : { top: 5, right: 30, left: 20, bottom: 5 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(tick) => formatDate(tick, true)}
              minTickGap={isFullscreen ? 15 : 30}
              tick={{ fontSize: isFullscreen ? 14 : 12 }}
            />
            <YAxis 
              tick={{ fontSize: isFullscreen ? 14 : 12 }}
              width={isFullscreen ? 60 : undefined}
            />
            <Tooltip 
              formatter={(value, name) => [formatNumber(value as number), name === 'created' ? 'Created Tickets' : 'Resolved Tickets']}
              labelFormatter={(label) => formatDate(label as string)}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                fontSize: isFullscreen ? '1rem' : '0.875rem',
                padding: isFullscreen ? '0.75rem' : '0.5rem'
              }}
            />
            <Legend 
              wrapperStyle={{
                fontSize: isFullscreen ? '1rem' : '0.875rem',
                paddingTop: isFullscreen ? '1rem' : '0.5rem'
              }}
            />
            <Line
              type="monotone"
              dataKey="created"
              stroke="#3b82f6"
              strokeWidth={isFullscreen ? 3 : 2}
              activeDot={{ r: isFullscreen ? 8 : 6 }}
              name="Created Tickets"
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="#10b981"
              strokeWidth={isFullscreen ? 3 : 2}
              activeDot={{ r: isFullscreen ? 8 : 6 }}
              name="Resolved Tickets"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  return (
    <ChartWrapper 
      title="Ticket Trends Over Time" 
      downloadAction={downloadCSV}
      footer="Shows created and resolved tickets over time"
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default TimeSeriesChart; 