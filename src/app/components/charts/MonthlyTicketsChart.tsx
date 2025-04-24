import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { useTickets } from '@/lib/contexts/TicketContext';
import { formatNumber } from '@/lib/utils';
import ChartWrapper from './ChartWrapper';
import { format, parse } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const COLORS = {
  default: '#3b82f6', // blue-500
  dark: '#60a5fa', // blue-400
};

// Pagination settings
const PERIODS_PER_PAGE = 12; // Number of periods to show at once
const SLIDE_AMOUNT = 6; // Number of periods to slide when clicking navigation buttons

// Palette for agent lines
const AGENT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6', '#eab308',
  '#14b8a6', '#ec4899', '#6366f1', '#f43f5e', '#0ea5e9', '#d946ef',
  '#22c55e', '#f59e0b', '#a855f7', '#84cc16', '#06b6d4', '#a78bfa',
  '#facc15', '#fb7185' 
];

/**
 * Ensures that all periods (months/weeks) in the date range are included in the chart data
 */
const fillMissingPeriods = (data: { name: string; value: number }[]) => {
  if (!data || data.length === 0) return [];
  
  const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
  const firstPeriod = sortedData[0].name;
  const lastPeriod = sortedData[sortedData.length - 1].name;
  
  // Handle both month (YYYY-MM) and week (YYYY-WNN) formats
  const isWeekFormat = firstPeriod.includes('W');
  
  if (isWeekFormat) {
    // Fill missing weeks
    const allPeriods: { name: string; value: number }[] = [];
    
    // Parse first and last week
    const [firstYear, firstWeekStr] = firstPeriod.split('-W');
    const [lastYear, lastWeekStr] = lastPeriod.split('-W');
    const firstYearNum = parseInt(firstYear);
    const firstWeekNum = parseInt(firstWeekStr);
    const lastYearNum = parseInt(lastYear);
    const lastWeekNum = parseInt(lastWeekStr);
    
    // Iterate through all weeks in the range
    let currentYear = firstYearNum;
    let currentWeek = firstWeekNum;
    
    while (
      currentYear < lastYearNum || 
      (currentYear === lastYearNum && currentWeek <= lastWeekNum)
    ) {
      const periodKey = `${currentYear}-W${currentWeek.toString().padStart(2, '0')}`;
      const existingData = data.find(item => item.name === periodKey);
      allPeriods.push(existingData || { name: periodKey, value: 0 });
      
      // Move to next week
      currentWeek++;
      if (currentWeek > 52) {
        currentWeek = 1;
        currentYear++;
      }
    }
    return allPeriods;
    
  } else {
    // Fill missing months (existing logic)
    const [firstYear, firstMonthNum] = firstPeriod.split('-').map(Number);
    const [lastYear, lastMonthNum] = lastPeriod.split('-').map(Number);
    
    const allPeriods: { name: string; value: number }[] = [];
    let currentYear = firstYear;
    let currentMonth = firstMonthNum;
    
    while (
      currentYear < lastYear || 
      (currentYear === lastYear && currentMonth <= lastMonthNum)
    ) {
      const periodKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      const existingData = data.find(item => item.name === periodKey);
      allPeriods.push(existingData || { name: periodKey, value: 0 });
      
      // Move to next month
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    return allPeriods;
  }
};

/**
 * Transforms monthly/weekly agent data and fills missing periods for line chart
 */
const processAgentTimeData = (
  periodAgentData: { [period: string]: { [agentName: string]: number } },
  selectedAgents: string[]
) => {
  if (!periodAgentData || Object.keys(periodAgentData).length === 0 || selectedAgents.length === 0) {
    return [];
  }

  const sortedPeriods = Object.keys(periodAgentData).sort();
  const firstPeriod = sortedPeriods[0];
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
  
  const isWeekFormat = firstPeriod.includes('W');
  const chartData: { name: string; [agentName: string]: number | string }[] = [];
  
  if (isWeekFormat) {
    // Process weeks
    const [firstYear, firstWeekStr] = firstPeriod.split('-W');
    const [lastYear, lastWeekStr] = lastPeriod.split('-W');
    const firstYearNum = parseInt(firstYear);
    const firstWeekNum = parseInt(firstWeekStr);
    const lastYearNum = parseInt(lastYear);
    const lastWeekNum = parseInt(lastWeekStr);
    
    let currentYear = firstYearNum;
    let currentWeek = firstWeekNum;
    
    while (
      currentYear < lastYearNum || 
      (currentYear === lastYearNum && currentWeek <= lastWeekNum)
    ) {
      const periodKey = `${currentYear}-W${currentWeek.toString().padStart(2, '0')}`;
      const periodEntry: { name: string; [agentName: string]: number | string } = { name: periodKey };
      
      selectedAgents.forEach(agent => {
        periodEntry[agent] = periodAgentData[periodKey]?.[agent] || 0;
      });
      
      chartData.push(periodEntry);
      
      // Move to next week
      currentWeek++;
      if (currentWeek > 52) {
        currentWeek = 1;
        currentYear++;
      }
    }
  } else {
    // Process months (existing logic)
    const [firstYear, firstMonthNum] = firstPeriod.split('-').map(Number);
    const [lastYear, lastMonthNum] = lastPeriod.split('-').map(Number);
    
    let currentYear = firstYear;
    let currentMonth = firstMonthNum;
    
    while (
      currentYear < lastYear || 
      (currentYear === lastYear && currentMonth <= lastMonthNum)
    ) {
      const periodKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      const periodEntry: { name: string; [agentName: string]: number | string } = { name: periodKey };
      
      selectedAgents.forEach(agent => {
        periodEntry[agent] = periodAgentData[periodKey]?.[agent] || 0;
      });
      
      chartData.push(periodEntry);
      
      // Move to next month
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
  }

  return chartData.sort((a, b) => a.name.localeCompare(b.name));
};

const formatPeriodLabel = (period: string) => {
  if (period.includes('W')) {
    // Week format: "2023-W01" -> "Week 1, 2023"
    const [year, weekStr] = period.split('-W');
    const weekNum = parseInt(weekStr);
    return `Week ${weekNum}, ${year}`;
  } else {
    // Month format: "2023-01" -> "Jan 2023"
    try {
      const date = parse(period, 'yyyy-MM', new Date());
      return format(date, 'MMM yyyy');
    } catch (e) {
      return period;
    }
  }
};

const MonthlyTicketsChart: React.FC = () => {
  const { 
    monthlyData, 
    weeklyData,
    monthlyAgentData, 
    weeklyAgentData,
    filters, 
    setFilters 
  } = useTickets();
  
  // State for chart interactions
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');
  const [highlightedAgent, setHighlightedAgent] = useState<string | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [inactiveAgents, setInactiveAgents] = useState<string[]>([]);
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Pagination state
  const [startIdx, setStartIdx] = useState(0);
  
  const selectedAgents = filters.agents;
  const isAgentView = selectedAgents.length > 0;

  // Reset interaction state when dependencies change
  React.useEffect(() => {
    setHighlightedAgent(null);
    setInactiveAgents([]);
    setHoveredAgent(null);
    setStartIdx(0); // Reset to first page when view mode changes
  }, [selectedAgents, viewMode]);

  // Get appropriate data based on view mode
  const periodData = viewMode === 'month' ? monthlyData : weeklyData;
  const periodAgentData = viewMode === 'month' ? monthlyAgentData : weeklyAgentData;

  // Process data for charts
  const fullTotalData = useMemo(() => {
    if (isAgentView) return [];
    
    const mappedData = periodData?.map(item => ({
      name: viewMode === 'month' ? item.yearMonth : item.yearWeek,
      value: item.count
    })) || [];
    
    return fillMissingPeriods(mappedData);
  }, [periodData, isAgentView, viewMode]);

  const fullAgentData = useMemo(() => {
    if (!isAgentView) return [];
    return processAgentTimeData(periodAgentData, selectedAgents);
  }, [periodAgentData, selectedAgents, isAgentView, viewMode]);

  // Apply pagination to the data
  const totalData = useMemo(() => {
    const data = fullTotalData;
    const end = Math.min(startIdx + PERIODS_PER_PAGE, data.length);
    return data.slice(startIdx, end);
  }, [fullTotalData, startIdx]);

  const agentDataForChart = useMemo(() => {
    const data = fullAgentData;
    const end = Math.min(startIdx + PERIODS_PER_PAGE, data.length);
    return data.slice(startIdx, end);
  }, [fullAgentData, startIdx]);

  // Pagination controls
  const canGoBack = startIdx > 0;
  const canGoForward = isAgentView 
    ? startIdx + PERIODS_PER_PAGE < fullAgentData.length
    : startIdx + PERIODS_PER_PAGE < fullTotalData.length;

  const goBack = () => {
    if (!canGoBack) return;
    setStartIdx(prev => Math.max(0, prev - SLIDE_AMOUNT));
  };

  const goForward = () => {
    if (!canGoForward) return;
    const maxStartIdx = isAgentView 
      ? Math.max(0, fullAgentData.length - PERIODS_PER_PAGE)
      : Math.max(0, fullTotalData.length - PERIODS_PER_PAGE);
    setStartIdx(prev => Math.min(maxStartIdx, prev + SLIDE_AMOUNT));
  };

  const handlePeriodRangeSelection = () => {
    if (refAreaLeft === refAreaRight || !refAreaLeft || !refAreaRight) {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }
    
    // Ensure chronological order
    const startPeriod = refAreaLeft < refAreaRight ? refAreaLeft : refAreaRight;
    const endPeriod = refAreaLeft < refAreaRight ? refAreaRight : refAreaLeft;
    
    try {
      let startDate, endDate;
      
      if (viewMode === 'week') {
        // Handle week format
        const [startYear, startWeekStr] = startPeriod.split('-W');
        const [endYear, endWeekStr] = endPeriod.split('-W');
        
        // For simplicity, approximate week start/end dates
        // Week 1 is approximately Jan 1
        startDate = new Date(parseInt(startYear), 0, parseInt(startWeekStr) * 7);
        
        // End date is approximately the end of the week
        endDate = new Date(parseInt(endYear), 0, parseInt(endWeekStr) * 7 + 6);
      } else {
        // Handle month format - original code
        startDate = new Date(`${startPeriod}-01`);
        const [endYear, endMonth] = endPeriod.split('-').map(Number);
        endDate = new Date(endYear, endMonth, 0); // Last day of month
      }
      
      // Update filters
      setFilters({ dateRange: [startDate, endDate] });
    } catch (error) {
      console.error('Error setting date range:', error);
    }
    
    // Clear selection
    setRefAreaLeft('');
    setRefAreaRight('');
  };
  
  const clearDateRange = () => {
    setFilters({ dateRange: [null, null] });
  };
  
  // Update chart interaction handlers to work in both views
  const handleLegendClick = (o: any) => {
    const agentName = String(o.dataKey || '');
    if (!agentName) return;

    const isCurrentlyInactive = inactiveAgents.includes(agentName);
    const isCurrentlyHighlighted = highlightedAgent === agentName;

    if (isCurrentlyInactive) {
      // ACTION: Make active and highlight
      setInactiveAgents(prev => prev.filter(agent => agent !== agentName));
      setHighlightedAgent(agentName);
    } else if (isCurrentlyHighlighted) {
      // ACTION: Make inactive (was active and highlighted)
      setInactiveAgents(prev => [...prev, agentName]);
      setHighlightedAgent(null);
    } else {
      // ACTION: Highlight (was active but not highlighted)
      setHighlightedAgent(agentName);
      // Ensure it's not inactive (shouldn't be necessary here, but safe)
      if (inactiveAgents.includes(agentName)) {
           setInactiveAgents(prev => prev.filter(agent => agent !== agentName));
      }
    }
  };
  
  const downloadCSV = () => { 
    let csvContent: string;
    let filename: string;

    if (isAgentView) {
      const activeAgents = selectedAgents.filter(agent => !inactiveAgents.includes(agent));
      const headers = ['Period', ...activeAgents];
      const rows = agentDataForChart.map(entry => 
        [entry.name, ...activeAgents.map(agent => entry[agent] || 0)]
      );
      csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename = `tickets_by_agent_${viewMode}.csv`;
    } else {
      csvContent = [
        ['Period', 'Ticket Count'],
        ...totalData.map((entry) => [entry.name, entry.value]),
      ].map((row) => row.join(',')).join('\n');
      filename = `tickets_total_${viewMode}.csv`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // -------- Chart Content --------
  const viewModeText = viewMode === 'month' ? 'Monthly' : 'Weekly';
  const chartTitle = isAgentView ? `${viewModeText} Tickets by Agent` : `${viewModeText} Tickets`;
  
  const chartFooter = `Click and drag to select a date range. ${isAgentView ? 'Click legend to highlight/toggle agent visibility.' : ''} Use arrows to navigate through time periods.`;
  
  // Calculate if there's currently a date filter applied
  const hasDateFilter = filters.dateRange[0] !== null && filters.dateRange[1] !== null;

  // Navigation buttons to include in the chart
  const navigationControls = (
    <div className="flex items-center justify-center space-x-2 mt-1 mb-2">
      <button
        onClick={goBack}
        disabled={!canGoBack}
        className={`p-1 rounded-full ${
          canGoBack
            ? 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
        aria-label="Previous periods"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {isAgentView
          ? fullAgentData.length > 0
            ? `Showing ${startIdx + 1}-${Math.min(startIdx + PERIODS_PER_PAGE, fullAgentData.length)} of ${fullAgentData.length}`
            : 'No data'
          : fullTotalData.length > 0
          ? `Showing ${startIdx + 1}-${Math.min(startIdx + PERIODS_PER_PAGE, fullTotalData.length)} of ${fullTotalData.length}`
          : 'No data'
        }
      </span>
      <button
        onClick={goForward}
        disabled={!canGoForward}
        className={`p-1 rounded-full ${
          canGoForward
            ? 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
        aria-label="Next periods"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );

  const renderTotalChart = () => (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <BarChart
        data={totalData}
        margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
        onMouseDown={(e) => e && e.activeLabel && setRefAreaLeft(e.activeLabel)}
        onMouseMove={(e) => refAreaLeft && e && e.activeLabel && setRefAreaRight(e.activeLabel)}
        onMouseUp={handlePeriodRangeSelection}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={70}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={formatPeriodLabel}
        />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={formatNumber} />
        <Tooltip
          formatter={(value) => [formatNumber(value as number), 'Total Tickets']}
          labelFormatter={(label) => `${viewMode === 'month' ? 'Month' : 'Week'}: ${formatPeriodLabel(label as string)}`}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        />
        <Legend />
        <Bar dataKey="value" name="Total Tickets" fill={COLORS.default} fillOpacity={0.8} activeBar={{ fill: COLORS.dark, fillOpacity: 1 }} />
        {refAreaLeft && refAreaRight && (
          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.3} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderAgentChart = () => (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <LineChart
        data={agentDataForChart}
        margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
        onMouseDown={(e) => e && e.activeLabel && setRefAreaLeft(e.activeLabel)}
        onMouseMove={(e) => {
          // Handle both hover over lines and reference area for date range selection
          if (e?.activePayload && e.activePayload.length > 0) {
              const payloadAgent = e.activePayload[0].dataKey; 
              if (payloadAgent && typeof payloadAgent === 'string' && 
                  selectedAgents.includes(payloadAgent) && 
                  !inactiveAgents.includes(payloadAgent)) {
                setHoveredAgent(payloadAgent);
              } else {
                setHoveredAgent(null);
              }
          } else {
              setHoveredAgent(null);
          }
          
          // Update reference area for period selection
          if (refAreaLeft && e?.activeLabel) {
            setRefAreaRight(e.activeLabel);
          }
        }}
        onMouseUp={handlePeriodRangeSelection}
        onMouseLeave={() => setHoveredAgent(null)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={70}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={formatPeriodLabel}
        />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={formatNumber} />
        <Tooltip
          formatter={(value, name) => [
              formatNumber(value as number),
              name ? `Tickets (${name})` : 'Tickets'
          ]}
          labelFormatter={(label) => `${viewMode === 'month' ? 'Month' : 'Week'}: ${formatPeriodLabel(label as string)}`}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        />
        <Legend 
          onClick={handleLegendClick} 
          formatter={(value, entry) => {
            const { color, dataKey } = entry;
            const agentName = String(dataKey || '');
            const inactive = inactiveAgents.includes(agentName);
            const highlighted = highlightedAgent === agentName;
            const fontWeight = highlighted ? 'bold' : 'normal';
            const finalColor = inactive ? '#aaa' : color;
            const textDecoration = inactive ? 'line-through' : 'none';
            return (
              <span style={{ color: finalColor, fontWeight, textDecoration, cursor: 'pointer' }}>
                {value}
              </span>
            );
          }}
        />
        {selectedAgents.map((agent, index) => {
          const isInactive = inactiveAgents.includes(agent);
          const isHighlighted = highlightedAgent === agent;
          const isHovered = hoveredAgent === agent;
          const color = AGENT_COLORS[index % AGENT_COLORS.length];
          
          // Determine stroke width and opacity based on states
          const strokeWidth = isInactive ? 1 : (isHighlighted ? 4 : (isHovered ? 3 : 2));
          const strokeOpacity = isInactive ? 0.1 : (isHighlighted || isHovered ? 1 : 0.8);

          return (
            <Line
              key={agent}
              type="monotone"
              dataKey={agent}
              name={agent}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
              activeDot={isInactive ? false : { r: 6, strokeWidth: 0, fill: color }}
              dot={false}
              connectNulls={true}
            />
          );
        })}
        {refAreaLeft && refAreaRight && (
          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#3b82f6" fillOpacity={0.3} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  const chartContent = (
    <>
      {(isAgentView ? agentDataForChart.length === 0 : totalData.length === 0) ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for the selected filters</p>
        </div>
      ) : (
        <>
          {isAgentView ? renderAgentChart() : renderTotalChart()}
          {navigationControls}
        </>
      )}
    </>
  );
  
  // Extra controls for chart options
  const chartControls = (
    <div className="flex justify-between mb-2">
      <div className="flex space-x-2">
        <button
          onClick={() => setViewMode('month')}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            viewMode === 'month' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            viewMode === 'week' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Weekly
        </button>
      </div>
      
      {hasDateFilter && (
        <button
          onClick={clearDateRange}
          className="px-2 py-1 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Clear Date Filter
        </button>
      )}
    </div>
  );
  
  return (
    <ChartWrapper 
      title={chartTitle} 
      downloadAction={downloadCSV}
      footer={chartFooter}
      extraControls={chartControls}
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default MonthlyTicketsChart; 