import React, { useState, useMemo, useEffect } from 'react';
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
  default: '#10b981', // Use a base color for the total bar chart
  dark: '#34d399',
};

// Use the same diverse palette as the agent chart for teams
const TEAM_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6', '#eab308',
  '#14b8a6', '#ec4899', '#6366f1', '#f43f5e', '#0ea5e9', '#d946ef',
  '#22c55e', '#f59e0b', '#a855f7', '#84cc16', '#06b6d4', '#a78bfa',
  '#facc15', '#fb7185' 
];

// Pagination settings (same as MonthlyTicketsChart)
const MAX_PERIODS_TO_SHOW = 12;
const SLIDE_STEP = Math.max(1, Math.floor(MAX_PERIODS_TO_SHOW / 2));

// --- Data Processing Functions (Reused from MonthlyTicketsChart) ---

// Reuse fillMissingPeriods from MonthlyTicketsChart
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
    // Fill missing months
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

// Adapt processTeamMonthlyData to support both week and month
const processTeamTimeData = (
  periodTeamData: { [period: string]: { [teamName: string]: number } },
  selectedTeams: string[]
) => {
  if (!periodTeamData || Object.keys(periodTeamData).length === 0 || selectedTeams.length === 0) return [];
  
  const sortedPeriods = Object.keys(periodTeamData).sort();
  const firstPeriod = sortedPeriods[0];
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
  
  const isWeekFormat = firstPeriod.includes('W');
  const chartData: { name: string; [teamName: string]: number | string }[] = [];
  
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
      const periodEntry: { name: string; [teamName: string]: number | string } = { name: periodKey };
      
      selectedTeams.forEach(team => {
        periodEntry[team] = periodTeamData[periodKey]?.[team] || 0;
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
    // Process months
    const [firstYear, firstMonthNum] = firstPeriod.split('-').map(Number);
    const [lastYear, lastMonthNum] = lastPeriod.split('-').map(Number);
    
    let currentYear = firstYear;
    let currentMonth = firstMonthNum;
    
    while (
      currentYear < lastYear || 
      (currentYear === lastYear && currentMonth <= lastMonthNum)
    ) {
      const periodKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      const periodEntry: { name: string; [teamName: string]: number | string } = { name: periodKey };
      
      selectedTeams.forEach(team => {
        periodEntry[team] = periodTeamData[periodKey]?.[team] || 0;
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

// Format period labels nicely
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

const TeamDistributionChart: React.FC = () => {
  const {
    monthlyData,
    weeklyData,
    monthlyTeamData,
    weeklyTeamData,
    filters,
    setFilters,
    teamData
  } = useTickets();

  // State for chart interactions
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');
  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [inactiveTeams, setInactiveTeams] = useState<string[]>([]);

  // State for view mode and pagination
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [startIndex, setStartIndex] = useState(0);
  const [periodsToShow, setPeriodsToShow] = useState<number | 'all'>(12); // State for adjustable periods

  const selectedTeams = filters.groups; // Use groups filter for teams
  const isTeamView = selectedTeams.length > 0;

  // Derived pagination constants
  const maxPeriods = periodsToShow === 'all' ? Infinity : periodsToShow;
  const slideStep = periodsToShow === 'all' ? 0 : Math.max(1, Math.floor(maxPeriods / 2));

  // Reset interaction state and pagination when dependencies change
  useEffect(() => {
    setHighlightedTeam(null);
    setInactiveTeams([]);
    setHoveredTeam(null);
    setStartIndex(0); // Reset pagination
  }, [selectedTeams, viewMode, periodsToShow]); // Reset on periodsToShow change too

  // Get appropriate data based on view mode
  const periodData = viewMode === 'month' ? monthlyData : weeklyData;
  const periodTeamData = viewMode === 'month' ? monthlyTeamData : weeklyTeamData;

  // --- Process FULL data first ---
  const fullTotalData = useMemo(() => {
    if (isTeamView) return [];
    const mappedData = periodData?.map(item => ({
      name: viewMode === 'month' ? item.yearMonth : item.yearWeek,
      value: item.count
    })) || [];
    return fillMissingPeriods(mappedData);
  }, [periodData, isTeamView, viewMode]);

  const fullTeamData = useMemo(() => {
    if (!isTeamView) return [];
    return processTeamTimeData(periodTeamData, selectedTeams);
  }, [periodTeamData, selectedTeams, isTeamView, viewMode]);

  // --- Calculate Pagination and Displayed Data ---
  const fullData = isTeamView ? fullTeamData : fullTotalData;
  const totalPeriods = fullData.length;
  const canPaginate = periodsToShow !== 'all' && totalPeriods > maxPeriods;

  // Adjust startIndex if it becomes invalid after periodsToShow changes
  useEffect(() => {
    if (typeof periodsToShow === 'number') {
      if (startIndex > totalPeriods - periodsToShow) {
        setStartIndex(Math.max(0, totalPeriods - periodsToShow));
      }
    } else { // periodsToShow is 'all'
      setStartIndex(0);
    }
  }, [periodsToShow, totalPeriods, startIndex]);

  const currentStartIndex = typeof periodsToShow === 'number'
    ? Math.max(0, Math.min(startIndex, totalPeriods - periodsToShow))
    : 0;

  const displayedData = useMemo(() => {
    if (periodsToShow === 'all' || !canPaginate) return fullData;
    return fullData.slice(currentStartIndex, currentStartIndex + maxPeriods);
  }, [fullData, currentStartIndex, maxPeriods, canPaginate, periodsToShow]);

  // --- Pagination Handlers ---
  const handlePrevious = () => {
    setStartIndex(prev => Math.max(0, prev - slideStep));
  };

  const handleNext = () => {
    if (typeof periodsToShow === 'number') {
      setStartIndex(prev => Math.min(totalPeriods - periodsToShow, prev + slideStep));
    }
  };

  const canGoPrevious = canPaginate && currentStartIndex > 0;
  const canGoNext = canPaginate && typeof periodsToShow === 'number' && currentStartIndex < totalPeriods - periodsToShow;

  // Handle range selection
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
        // Handle month format
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
  
  // Legend click handler for team line chart
  const handleLegendClick = (o: any) => {
    const teamName = String(o.dataKey || '');
    if (!teamName) return;

    const isCurrentlyInactive = inactiveTeams.includes(teamName);
    const isCurrentlyHighlighted = highlightedTeam === teamName;

    if (isCurrentlyInactive) {
      // ACTION: Make active and highlight
      setInactiveTeams(prev => prev.filter(team => team !== teamName));
      setHighlightedTeam(teamName);
    } else if (isCurrentlyHighlighted) {
      // ACTION: Make inactive (was active and highlighted)
      setInactiveTeams(prev => [...prev, teamName]);
      setHighlightedTeam(null);
    } else {
      // ACTION: Highlight (was active but not highlighted)
      setHighlightedTeam(teamName);
      // Ensure it's not inactive (shouldn't be necessary here, but safe)
      if (inactiveTeams.includes(teamName)) {
           setInactiveTeams(prev => prev.filter(team => team !== teamName));
      }
    }
  };
  
  // Download handler
  const downloadCSV = () => { 
    let csvContent: string;
    let filename: string;

    const dataToDownload = isTeamView ? fullTeamData : fullTotalData;

    if (isTeamView) {
      const activeTeams = selectedTeams.filter(team => !inactiveTeams.includes(team));
      const headers = ['Period', ...activeTeams];
      const rows = (dataToDownload as { name: string; [teamName: string]: number | string }[]).map(entry => 
        [entry.name, ...activeTeams.map(team => entry[team] || 0)]
      );
      csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename = `tickets_by_team_${viewMode}.csv`;
    } else {
      csvContent = [
        ['Period', 'Total Ticket Count'],
        ...(dataToDownload as { name: string; value: number }[]).map((entry) => [entry.name, entry.value]),
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
  const chartTitle = isTeamView ? `${viewModeText} Tickets by Team` : `${viewModeText} Tickets (All Teams)`;
  
  const chartFooter = `Click and drag to select a date range. ${isTeamView ? 'Click legend to highlight/toggle team visibility.' : ''}`;
  
  // Calculate if there's currently a date filter applied
  const hasDateFilter = filters.dateRange[0] !== null && filters.dateRange[1] !== null;

  // Render logic for the Bar Chart (Total View)
  const renderTotalChart = () => (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <BarChart
        data={displayedData}
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
          interval={0}
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
          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill={COLORS.default} fillOpacity={0.3} ifOverflow="visible" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  // Render logic for the Line Chart (Team View)
  const renderTeamChart = () => (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <LineChart
        data={displayedData}
        margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
        onMouseDown={(e) => e && e.activeLabel && setRefAreaLeft(e.activeLabel)}
        onMouseMove={(e) => {
          // Handle both hover over lines and reference area for date range selection
          if (e?.activePayload && e.activePayload.length > 0) {
              const payloadTeam = e.activePayload[0].dataKey; 
              if (payloadTeam && typeof payloadTeam === 'string' && 
                  selectedTeams.includes(payloadTeam) && 
                  !inactiveTeams.includes(payloadTeam)) {
                setHoveredTeam(payloadTeam);
              } else {
                setHoveredTeam(null);
              }
          } else {
              setHoveredTeam(null);
          }
          
          // Update reference area for period selection
          if (refAreaLeft && e?.activeLabel) {
            setRefAreaRight(e.activeLabel);
          }
        }}
        onMouseUp={handlePeriodRangeSelection}
        onMouseLeave={() => setHoveredTeam(null)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={70}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={formatPeriodLabel}
          interval={0}
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
            const teamName = String(dataKey || '');
            const inactive = inactiveTeams.includes(teamName);
            const highlighted = highlightedTeam === teamName;
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
        {selectedTeams.map((team, index) => {
          const isInactive = inactiveTeams.includes(team);
          const isHighlighted = highlightedTeam === team;
          const isHovered = hoveredTeam === team;
          const color = TEAM_COLORS[index % TEAM_COLORS.length];
          const strokeWidth = isInactive ? 1 : (isHighlighted ? 4 : (isHovered ? 3 : 2));
          const strokeOpacity = isInactive ? 0.1 : (isHighlighted || isHovered ? 1 : 0.8);

          return (
            <Line
              key={team}
              type="monotone"
              dataKey={team}
              name={team}
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
          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill={COLORS.default} fillOpacity={0.3} ifOverflow="visible" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  // Main chart content including pagination
  const chartContent = (
    <div className="flex flex-col h-full">
       {(isTeamView ? fullTeamData.length === 0 : fullTotalData.length === 0) ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for the selected filters</p>
        </div>
      ) : (
        <div className="flex-grow overflow-hidden"> {/* Add overflow-hidden */}
          {isTeamView ? renderTeamChart() : renderTotalChart()}
        </div>
      )}
      {/* Pagination Controls */}
      {canPaginate && (
        <div className="flex justify-center items-center mt-3 space-x-2 flex-shrink-0"> {/* Prevent shrinking */}
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="p-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
            aria-label="Previous period range"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
           <span className="text-xs text-gray-500 dark:text-gray-400">
             {/* Fix: Use typeof check */}
             {typeof periodsToShow === 'number' && displayedData.length > 0
               ? `Showing ${formatPeriodLabel(displayedData[0]?.name)} - ${formatPeriodLabel(displayedData[displayedData.length - 1]?.name)}`
               : 'Showing All'}
           </span>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="p-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
            aria-label="Next period range"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
  
  // Extra controls for chart options
  const chartControls = (
    <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2"> {/* Flex column on small screens */}
       {/* Left side controls: View Mode */} 
      <div className="flex space-x-2 items-center">
        <button
          onClick={() => { setViewMode('month'); }}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            viewMode === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => { setViewMode('week'); }}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            viewMode === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Weekly
        </button>
      </div>

      {/* Right side controls: Date Filter & Period Selector */} 
      <div className="flex space-x-2 items-center">
        {hasDateFilter && (
          <button
            onClick={clearDateRange}
            className="px-2 py-1 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Date Filter
          </button>
        )}
         {/* Period Selector Dropdown */} 
        <div className="relative">
          <select
            value={periodsToShow === 'all' ? 'all' : periodsToShow.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setPeriodsToShow(value === 'all' ? 'all' : parseInt(value));
            }}
            className="appearance-none text-xs px-2 py-1 pr-6 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select number of periods to show"
          >
            <option value="6">6 Periods</option>
            <option value="12">12 Periods</option>
            <option value="24">24 Periods</option>
            <option value="all">All Periods</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-700 dark:text-gray-400">
             <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>
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

// Export with the new name
export default TeamDistributionChart; 