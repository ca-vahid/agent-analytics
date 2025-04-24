import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LabelList
} from 'recharts';
import { useTickets } from '@/lib/contexts/TicketContext';
import { formatNumber } from '@/lib/utils';
import ChartWrapper from './ChartWrapper';

// Colors for the chart
const COLORS = {
  bars: '#22c55e', // green-500
  activeBars: '#16a34a', // green-600
  otherBar: '#94a3b8', // slate-400
};

// Maximum number of categories to display individually
const MAX_CATEGORIES = 15;

// Max length for category names in the chart
const MAX_NAME_LENGTH = 30;

// Define types for our chart data
interface CategoryChartData {
  name: string;
  value: number;
  percentage: number;
  isOther?: boolean;
  originalName?: string; // To store the original name if truncated
}

// Function to truncate long strings
const truncateName = (name: string): string => {
  if (name.length <= MAX_NAME_LENGTH) return name;
  return name.substring(0, MAX_NAME_LENGTH - 3) + '...';
};

const CategoryDistributionChart: React.FC = () => {
  const { categoryData, setFilters } = useTickets();

  // Process data - take top categories and group the rest as "Other"
  const processedData = React.useMemo(() => {
    if (!categoryData || categoryData.length === 0) return [] as CategoryChartData[];
    
    // Sort by count in descending order
    const sortedData = [...categoryData].sort((a, b) => b.count - a.count);
    
    if (sortedData.length <= MAX_CATEGORIES) {
      return sortedData.map(item => {
        const name = truncateName(item.label);
        return {
          name,
          value: item.count,
          percentage: item.percentage,
          originalName: name !== item.label ? item.label : undefined
        };
      }) as CategoryChartData[];
    }
    
    // Take top categories and create an "Other" category for the rest
    const topCategories = sortedData.slice(0, MAX_CATEGORIES).map(item => {
      const name = truncateName(item.label);
      return {
        name,
        value: item.count,
        percentage: item.percentage,
        originalName: name !== item.label ? item.label : undefined
      };
    }) as CategoryChartData[];
    
    const otherCategories = sortedData.slice(MAX_CATEGORIES);
    const otherCount = otherCategories.reduce((sum, item) => sum + item.count, 0);
    const otherPercentage = otherCategories.reduce((sum, item) => sum + item.percentage, 0);
    
    return [
      ...topCategories,
      {
        name: 'Other',
        value: otherCount,
        percentage: otherPercentage,
        isOther: true
      }
    ] as CategoryChartData[];
  }, [categoryData]);

  const handleBarClick = (data: CategoryChartData) => {
    if (data && data.name && !data.isOther) {
      // Use original name if it exists
      const categoryName = data.originalName || data.name;
      setFilters({ categories: [categoryName] });
    } else if (data && data.isOther) {
      // Maybe show a modal with all other categories in the future
      console.log('Clicked on Other category');
    }
  };
  
  const downloadCSV = () => {
    if (!categoryData) return;
    
    // Create CSV content
    const csvContent = [
      ['Category', 'Ticket Count', 'Percentage'],
      ...categoryData.map((entry) => [entry.label, entry.count, entry.percentage]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'category_distribution.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Chart content
  const chartContent = (
    <>
      {processedData.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for the selected filters</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <BarChart
            data={processedData}
            layout="vertical"
            margin={{ top: 5, right: 60, left: 120, bottom: 5 }}
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
              width={120}
              tickMargin={5}
            />
            <Tooltip
              formatter={(value, name, props) => {
                if (name === 'value') {
                  return [formatNumber(value as number), 'Tickets'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => {
                const entry = processedData.find(item => item.name === label);
                return `Category: ${entry?.originalName || label}`;
              }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Ticket Count" 
              fill={COLORS.bars}
              fillOpacity={0.8}
              activeBar={{ fill: COLORS.activeBars, fillOpacity: 1 }}
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
              {processedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isOther ? COLORS.otherBar : COLORS.bars} 
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
      title="Tickets by Category" 
      downloadAction={downloadCSV}
      footer="Click on a bar to filter by that category. Top 15 categories shown."
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default CategoryDistributionChart; 