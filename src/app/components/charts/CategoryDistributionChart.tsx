"use client";

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
  unknownBar: '#cbd5e1', // slate-300
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
  isUnknown?: boolean;
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
    
    // 1. Handle 'Unknown' and 'Unassigned' categories - these are tickets with no category assigned
    const unknownCategories = categoryData.filter(item => 
      item.label.toLowerCase() === 'unknown' || 
      item.label.toLowerCase() === 'unassigned'
    );
    
    // Calculate total for Unknown
    const unknownCount = unknownCategories.reduce((sum, item) => sum + item.count, 0);
    const unknownPercentage = unknownCategories.reduce((sum, item) => sum + (item.percentage || 0), 0);
    
    // 2. Handle all valid categories (not unknown/unassigned)
    const validCategories = categoryData.filter(item => 
      item.label.toLowerCase() !== 'unknown' && 
      item.label.toLowerCase() !== 'unassigned'
    );
    
    // 3. Handle the special case where "Other" is an actual category in the data
    // First, separate any categories actually named "Other" from the rest
    const actualOtherCategory = validCategories.find(item => 
      item.label.toLowerCase() === 'other'
    );
    
    // Get all categories except those named "Other" (we'll handle that separately)
    const categoriesExcludingOther = validCategories.filter(item => 
      item.label.toLowerCase() !== 'other'
    );
    
    // 4. Sort remaining categories by count (descending)
    const sortedCategories = [...categoriesExcludingOther].sort((a, b) => b.count - a.count);
    
    // 5. Take top N categories
    const topCategories = sortedCategories.slice(0, MAX_CATEGORIES)
      .map(item => {
        const name = truncateName(item.label);
        return {
          name,
          value: item.count,
          percentage: item.percentage || 0,
          originalName: name !== item.label ? item.label : undefined
        };
      }) as CategoryChartData[];
    
    // Start building result with top categories
    let result = [...topCategories];
    
    // 6. Combine less frequent categories into a calculated "Other" group
    if (sortedCategories.length > MAX_CATEGORIES) {
      const otherCategories = sortedCategories.slice(MAX_CATEGORIES);
      const otherCount = otherCategories.reduce((sum, item) => sum + item.count, 0);
      const otherPercentage = otherCategories.reduce((sum, item) => sum + (item.percentage || 0), 0);
      
      // Only add calculated "Other" if there are actually categories to group
      if (otherCount > 0) {
        result.push({
          name: 'Less Frequent Categories',  // Rename to avoid confusion with an actual "Other" category
          value: otherCount,
          percentage: otherPercentage,
          isOther: true
        });
      }
    }
    
    // 7. If there's an actual "Other" category in the original data, add it separately
    // (this ensures it's never grouped with the calculated "Other")
    if (actualOtherCategory) {
      result.push({
        name: 'Other',  // This is the actual category name from the data
        value: actualOtherCategory.count,
        percentage: actualOtherCategory.percentage || 0,
        // Don't mark this as isOther: true, so it gets the regular green color
      });
    }
    
    // 8. Add Unknown category at the end if it exists
    if (unknownCount > 0) {
      result.push({
        name: 'Unknown',
        value: unknownCount,
        percentage: unknownPercentage,
        isUnknown: true
      });
    }
    
    return result;
  }, [categoryData]);

  const handleBarClick = (data: CategoryChartData) => {
    if (data && data.name && !data.isOther && !data.isUnknown) {
      // Use original name if it exists
      const categoryName = data.originalName || data.name;
      setFilters({ categories: [categoryName] });
    } else if (data && data.isOther) {
      // Maybe show a modal with all other categories in the future
      console.log('Clicked on Less Frequent Categories group');
    } else if (data && data.isUnknown) {
      // Filter by Unknown category
      setFilters({ categories: ['Unknown'] });
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
                if (entry?.isOther) {
                  return 'Less Frequent Categories (Combined)';
                } else if (entry?.isUnknown) {
                  return 'Unknown - Tickets with no category assigned';
                }
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
                  fill={
                    entry.isUnknown 
                      ? COLORS.unknownBar 
                      : (entry.isOther ? COLORS.otherBar : COLORS.bars)
                  } 
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
      footer={
        <div className="text-sm space-y-1">
          <p>Click on a bar to filter by that category. Top {MAX_CATEGORIES} most frequent categories shown.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-1" style={{backgroundColor: COLORS.bars}}></span>
              <span>Individual categories</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-1" style={{backgroundColor: COLORS.otherBar}}></span>
              <span>Less Frequent Categories (combined)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-1" style={{backgroundColor: COLORS.unknownBar}}></span>
              <span>Unknown (no category assigned)</span>
            </div>
          </div>
        </div>
      }
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default CategoryDistributionChart; 