"use client";

import React, { useState } from 'react';
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
import TicketViewerModal from '../TicketViewerModal';

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
  const { categoryData, tickets, filteredTickets } = useTickets();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ticketsToView, setTicketsToView] = useState<any[]>([]);

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
    
    // 3. Handle all categories including "Other" - no special treatment for "Other" now
    // Sort all valid categories by count (descending)
    const sortedCategories = [...validCategories].sort((a, b) => b.count - a.count);
    
    // 4. Take top N categories
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
    
    // 5. Combine less frequent categories into a calculated "Less Frequent Categories" group
    if (sortedCategories.length > MAX_CATEGORIES) {
      const otherCategories = sortedCategories.slice(MAX_CATEGORIES);
      const otherCount = otherCategories.reduce((sum, item) => sum + item.count, 0);
      const otherPercentage = otherCategories.reduce((sum, item) => sum + (item.percentage || 0), 0);
      
      // Only add calculated "Other" if there are actually categories to group
      if (otherCount > 0) {
        result.push({
          name: 'Less Frequent Categories',  // Renamed to avoid confusion
          value: otherCount,
          percentage: otherPercentage,
          isOther: true,
          // Store the original category names for the modal
          originalName: otherCategories.map(cat => cat.label).join(',')
        });
      }
    }
    
    // 6. Add Unknown category at the end if it exists (renamed to "Tickets with no Categories")
    if (unknownCount > 0) {
      result.push({
        name: 'Tickets with no Categories',  // Renamed from "Unknown"
        value: unknownCount,
        percentage: unknownPercentage,
        isUnknown: true
      });
    }
    
    return result;
  }, [categoryData]);

  const handleBarClick = (data: CategoryChartData) => {
    if (!data) return;
    
    let categoryToFilter = '';
    let modalTitle = '';
    let ticketsToShow = [];
    
    // Use filteredTickets instead of all tickets to respect existing filters
    if (data.isUnknown) {
      // Handle tickets with no category
      categoryToFilter = '';
      modalTitle = 'Tickets with no Categories';
      ticketsToShow = filteredTickets.filter(ticket => 
        !ticket.category || 
        ticket.category.toLowerCase() === 'unknown' || 
        ticket.category.toLowerCase() === 'unassigned'
      );
    } else if (data.isOther) {
      // Handle "Less Frequent Categories"
      modalTitle = 'Less Frequent Categories';
      
      // Get the list of top category names
      const topCategoryNames = processedData
        .filter(item => !item.isOther && !item.isUnknown)
        .map(item => item.originalName || item.name);
      
      // Find tickets that aren't in the top categories and have a category
      ticketsToShow = filteredTickets.filter(ticket => 
        ticket.category && 
        ticket.category.toLowerCase() !== 'unknown' &&
        ticket.category.toLowerCase() !== 'unassigned' &&
        !topCategoryNames.includes(ticket.category)
      );
    } else {
      // Regular category
      categoryToFilter = data.originalName || data.name;
      modalTitle = `Category: ${categoryToFilter}`;
      ticketsToShow = filteredTickets.filter(ticket => ticket.category === categoryToFilter);
    }
    
    setSelectedCategory(modalTitle);
    setTicketsToView(ticketsToShow);
    setModalVisible(true);
  };
  
  const closeModal = () => {
    setModalVisible(false);
    setSelectedCategory(null);
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
                  return 'Tickets with no Categories';
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

      {/* Ticket Viewer Modal */}
      <TicketViewerModal 
        isOpen={modalVisible}
        onClose={closeModal}
        tickets={ticketsToView}
        title={selectedCategory || 'Tickets'}
      />
    </>
  );

  return (
    <ChartWrapper 
      title="Tickets by Category" 
      downloadAction={downloadCSV}
      footer={
        <div className="text-sm space-y-1">
          <p>Click on a bar to view detailed tickets for that category. Top {MAX_CATEGORIES} most frequent categories shown.</p>
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
              <span>Tickets with no Categories</span>
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