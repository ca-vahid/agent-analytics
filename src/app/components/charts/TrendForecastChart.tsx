"use client";
// This chart uses React hooks and Recharts, must be a Client Component
import React, { useMemo, Fragment } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Label
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { useTickets } from '@/lib/contexts/TicketContext';
import { InformationCircleIcon } from '@heroicons/react/20/solid';

interface TrendForecastChartProps {
  scope: 'agent' | 'team';
  names: string[]; // list of agents or teams to display
  granularity: 'weekly' | 'monthly';
  forecastPeriods: number;
  method: 'linear' | 'exponential';
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e42', // orange
  '#a855f7', // purple
  '#eab308', // yellow
  '#6366f1', // indigo
  '#f472b6', // pink
  '#6b7280', // gray
];

// Helper functions for statistical calculations
const calculateRSquared = (xs: number[], ys: number[], slope: number, intercept: number): number => {
  if (xs.length < 2) return 0;
  
  const yMean = ys.reduce((sum, y) => sum + y, 0) / ys.length;
  
  // Total sum of squares
  const ssTot = ys.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  if (ssTot === 0) return 0; // Avoid division by zero
  
  // Residual sum of squares
  const ssRes = xs.reduce((sum, x, i) => {
    const prediction = intercept + slope * x;
    return sum + Math.pow(ys[i] - prediction, 2);
  }, 0);
  
  return 1 - (ssRes / ssTot);
};

const getTrendDirection = (slope: number): string => {
  // Increase threshold slightly to avoid classifying near-zero slopes
  if (Math.abs(slope) < 0.05) return "Stable";
  return slope > 0 ? "Increasing" : "Decreasing";
};

const calculateGrowthRate = (first: number, last: number, periods: number): number => {
  if (periods <= 1 || first === 0) return 0;
  // Simple percent change for period growth
  return (last - first) / Math.abs(first);
};

const calculateTrendGrowth = (start: number, end: number, periods: number): number => {
  if (periods <= 1 || start === 0) return 0;
  // Simple percent change for trend growth
  return (end - start) / Math.abs(start);
};

// Holt's Linear Trend (Double Exponential Smoothing)
const holtSmoothing = (ys: number[], alpha: number, beta: number, forecastPeriods: number): { smoothed: number[], trend: number[], forecast: number[] } => {
  const n = ys.length;
  if (n < 2) return { smoothed: ys, trend: Array(n).fill(0), forecast: Array(forecastPeriods).fill(ys[0] || 0) };

  const smoothed = Array(n).fill(0);
  const trend = Array(n).fill(0);

  // Initialization
  smoothed[0] = ys[0];
  trend[0] = ys[1] - ys[0]; // Initial trend estimate

  // Smoothing
  for (let i = 1; i < n; i++) {
    smoothed[i] = alpha * ys[i] + (1 - alpha) * (smoothed[i - 1] + trend[i - 1]);
    trend[i] = beta * (smoothed[i] - smoothed[i - 1]) + (1 - beta) * trend[i - 1];
  }

  // Forecasting
  const forecast: number[] = [];
  const lastSmoothed = smoothed[n - 1];
  const lastTrend = trend[n - 1];

  for (let h = 1; h <= forecastPeriods; h++) {
    forecast.push(lastSmoothed + h * lastTrend);
  }

  return { smoothed, trend, forecast };
};

// Add an InfoTooltip component for explaining stats
interface InfoTooltipProps {
  label: string;
  explanation: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ label, explanation }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  return (
    <div className="flex items-center relative">
      <div className="text-gray-500 dark:text-gray-400">{label}</div>
      <button 
        className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        aria-label={`Info about ${label}`}
      >
        <InformationCircleIcon className="h-3.5 w-3.5" />
      </button>
      
      {showTooltip && (
        <div className="absolute left-0 bottom-6 w-60 p-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded shadow-lg border border-gray-200 dark:border-gray-600 z-10">
          {explanation}
        </div>
      )}
    </div>
  );
};

const TrendForecastChart: React.FC<TrendForecastChartProps> = ({
  scope,
  names,
  granularity,
  forecastPeriods,
  method
}) => {
  const {
    weeklyAgentData,
    weeklyTeamData,
    monthlyAgentData,
    monthlyTeamData
  } = useTickets();

  // Additional statistics to display
  const stats = useMemo(() => {
    const results: Record<string, { 
      r2: number, 
      trendDirection: string,
      growthRate: number,
      slope: number,
      lastActualValue: number,
      firstForecastValue: number,
      periodGrowth: number,
      trendGrowth: number,
    }> = {};
    
    names.forEach(name => {
      results[name] = {
        r2: 0,
        trendDirection: "Unknown", 
        growthRate: 0,
        slope: 0,
        lastActualValue: 0,
        firstForecastValue: 0,
        periodGrowth: 0,
        trendGrowth: 0,
      };
    });
    
    return results;
  }, [names]);

  // Build chart data for all selected names
  const chartData = useMemo(() => {
    const rawData =
      granularity === 'weekly'
        ? (scope === 'agent' ? weeklyAgentData : weeklyTeamData)
        : (scope === 'agent' ? monthlyAgentData : monthlyTeamData);

    // Get all periods
    const allPeriods = Array.from(
      new Set(
        Object.keys(rawData).flatMap(period => period)
      )
    ).sort();

    // For each name, build actual and forecast series
    const nameSeries = names.map((name) => {
      // Actuals
      const dataPoints = Object.entries(rawData)
        .map(([period, counts]) => ({ period, count: counts[name] || 0 }))
        .sort((a, b) => a.period.localeCompare(b.period));
      const n = dataPoints.length;
      const actualSeries = dataPoints.map(pt => pt.count);
      
      // Forecast
      let forecastValues: number[] = [];
      let slope = 0;
      let intercept = 0;
      let lastActualValue = 0;
      let firstForecastValue = 0;
      let finalTrend = 0; // For Holt's method stats
      
      if (n > 0) {
        lastActualValue = actualSeries[n - 1] || 0;
        
        if (method === 'linear') {
          const xs = actualSeries.map((_, i) => i);
          const ys = actualSeries;
          const xBar = xs.reduce((sum, x) => sum + x, 0) / n;
          const yBar = ys.reduce((sum, y) => sum + y, 0) / n;
          const cov = xs.reduce((sum, x, i) => sum + (x - xBar) * (ys[i] - yBar), 0);
          const varX = xs.reduce((sum, x) => sum + (x - xBar) * (x - xBar), 0);
          slope = varX === 0 ? 0 : cov / varX;
          intercept = yBar - slope * xBar;
          
          // Calculate first forecast value
          const xi = n - 1;
          firstForecastValue = Math.round(intercept + slope * xi);
          
          // Calculate additional statistics
          stats[name].r2 = calculateRSquared(xs, ys, slope, intercept);
          stats[name].trendDirection = getTrendDirection(slope);
          stats[name].growthRate = calculateGrowthRate(actualSeries[0], actualSeries[n-1], n);
          stats[name].slope = slope;
          stats[name].lastActualValue = lastActualValue;
          stats[name].firstForecastValue = firstForecastValue;
          
          // Calculate period growth (actuals)
          const periodGrowth = calculateGrowthRate(actualSeries[0], actualSeries[n-1], n);
          // Calculate trend growth (regression line)
          const regStart = intercept + slope * 0;
          const regEnd = intercept + slope * (n-1);
          const trendGrowth = calculateTrendGrowth(regStart, regEnd, n);
          stats[name].periodGrowth = periodGrowth;
          stats[name].trendGrowth = trendGrowth;
          
          for (let i = 1; i <= forecastPeriods; i++) {
            const xi = (n - 1) + i;
            forecastValues.push(intercept + slope * xi);
          }
        } else { // Exponential Smoothing (Now Holt's Method)
          // --- Holt's Method Implementation --- 
          const alpha = 0.2; // Smoothing factor for level (can be tuned)
          const beta = 0.1;  // Smoothing factor for trend (can be tuned)

          const { forecast, trend: holtTrend } = holtSmoothing(actualSeries, alpha, beta, forecastPeriods);
          forecastValues = forecast;
          finalTrend = holtTrend[n - 1] || 0; // Store final trend for stats

          // First forecast value is based on Holt's formula
          if (forecastValues.length > 0) {
            firstForecastValue = Math.round(forecastValues[0]);
          }

          // Calculate stats for Holt's method
          const growthRate = calculateGrowthRate(actualSeries[0], actualSeries[n-1], n);
          stats[name].growthRate = growthRate;
          stats[name].trendDirection = getTrendDirection(finalTrend); // Use Holt's trend
          stats[name].r2 = 0; // R-squared not standard for Holt's
          stats[name].slope = finalTrend; // Represent trend with final Holt trend value
          stats[name].lastActualValue = lastActualValue;
          stats[name].firstForecastValue = firstForecastValue;

          // Calculate period growth (actuals)
          const periodGrowth = calculateGrowthRate(actualSeries[0], actualSeries[n-1], n);
          // Calculate trend growth (smoothed series)
          const holt = holtSmoothing(actualSeries, alpha, beta, forecastPeriods);
          const smoothedStart = holt.smoothed[0];
          const smoothedEnd = holt.smoothed[n-1];
          const trendGrowth = calculateTrendGrowth(smoothedStart, smoothedEnd, n);
          stats[name].periodGrowth = periodGrowth;
          stats[name].trendGrowth = trendGrowth;
        }
      }
      // Build period labels for forecast
      const last = dataPoints[n - 1]?.period || '';
      const forecastPeriodsArr: string[] = [];
      for (let idx = 0; idx < forecastPeriods; idx++) {
        let period = last;
        if (granularity === 'weekly') {
          const [yearStr, weekStr] = last.split('-W');
          let year = parseInt(yearStr, 10);
          let week = parseInt(weekStr, 10) + idx + 1;
          while (week > 52) {
            week -= 52;
            year += 1;
          }
          period = `${year}-W${week.toString().padStart(2, '0')}`;
        } else {
          const [yearStr, monthStr] = last.split('-');
          let year = parseInt(yearStr, 10);
          let month = parseInt(monthStr, 10) + idx + 1;
          while (month > 12) {
            month -= 12;
            year += 1;
          }
          period = `${year}-${month.toString().padStart(2, '0')}`;
        }
        forecastPeriodsArr.push(period);
      }
      return { name, dataPoints, forecastValues, forecastPeriodsArr };
    });

    // Build combined chart data by period
    const allChartPeriods = Array.from(
      new Set(
        nameSeries.flatMap(series => [
          ...series.dataPoints.map(pt => pt.period),
          ...series.forecastPeriodsArr
        ])
      )
    ).sort();

    // For each period, build a row with actual/forecast for each name
    return allChartPeriods.map(period => {
      const row: any = { period };
      nameSeries.forEach((series, idx) => {
        // Actual
        const foundActual = series.dataPoints.find(pt => pt.period === period);
        row[`actual_${series.name}`] = foundActual ? foundActual.count : null;
        
        // Forecast
        const fIdx = series.forecastPeriodsArr.indexOf(period);
        // Connect the first forecast point to the last actual point
        if (foundActual && series.dataPoints.indexOf(foundActual) === series.dataPoints.length - 1) {
          row[`forecast_${series.name}`] = foundActual.count; 
        } else if (fIdx !== -1) {
          row[`forecast_${series.name}`] = Math.max(0, Math.round(series.forecastValues[fIdx])); // Ensure forecast isn't negative
        } else {
          row[`forecast_${series.name}`] = null;
        }
      });
      return row;
    });
  }, [names, scope, granularity, forecastPeriods, method, weeklyAgentData, weeklyTeamData, monthlyAgentData, monthlyTeamData, stats]);
  
  const renderStatistics = () => {
    return (
      <div className="text-xs grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 bg-gray-50 dark:bg-gray-800/50 rounded p-2">
        {names.map((name, idx) => {
          const nameStat = stats[name];
          if (!nameStat) return null;
          
          const r2Percent = (nameStat.r2 * 100).toFixed(1);
          // Show both period and trend growth
          const periodGrowthPercent = (nameStat.periodGrowth * 100).toFixed(2);
          const trendGrowthPercent = (nameStat.trendGrowth * 100).toFixed(2);
          
          return (
            <div key={name} className="text-left p-2 border border-gray-200 dark:border-gray-700 rounded">
              <div className="font-semibold text-sm mb-1 flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                {name}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <InfoTooltip 
                  label="Trend Direction:" 
                  explanation="Whether the overall trend is increasing, decreasing, or stable based on the slope of the line of best fit." 
                />
                <div className={`font-medium ${nameStat.trendDirection === "Increasing" ? "text-green-600 dark:text-green-400" : 
                                   nameStat.trendDirection === "Decreasing" ? "text-red-600 dark:text-red-400" : 
                                   "text-gray-600 dark:text-gray-300"}`}>
                  {nameStat.trendDirection}
                </div>
                
                <InfoTooltip 
                  label="Slope:" 
                  explanation="The rate of change per period. A positive value means an upward trend; negative means downward. The magnitude indicates how steep the trend is." 
                />
                <div className="font-medium text-gray-700 dark:text-gray-300">{nameStat.slope.toFixed(3)}</div>
                
                <InfoTooltip 
                  label="Period Growth (actual):" 
                  explanation="Percentage change from the first to last actual data point. This compares only the start and end points, ignoring values in between." 
                />
                <div className={`font-medium ${parseFloat(periodGrowthPercent) > 0 ? "text-green-600 dark:text-green-400" : 
                                   parseFloat(periodGrowthPercent) < 0 ? "text-red-600 dark:text-red-400" : 
                                   "text-gray-600 dark:text-gray-300"}`}>
                  {periodGrowthPercent}%
                </div>
                
                <InfoTooltip 
                  label="Trend Growth (model):" 
                  explanation={`Percentage change based on the statistical model (${method === 'linear' ? 'linear regression' : 'exponential smoothing'}). This better reflects the overall trend direction than Period Growth.`} 
                />
                <div className={`font-medium ${parseFloat(trendGrowthPercent) > 0 ? "text-green-600 dark:text-green-400" : 
                                   parseFloat(trendGrowthPercent) < 0 ? "text-red-600 dark:text-red-400" : 
                                   "text-gray-600 dark:text-gray-300"}`}>
                  {trendGrowthPercent}%
                </div>
                
                {method === 'linear' && nameStat.r2 !== 0 && (
                  <>
                    <InfoTooltip 
                      label="R² Value:" 
                      explanation="Coefficient of determination - shows how well the data fits the trend line. Higher values (closer to 100%) indicate a better fit and more reliable forecast." 
                    />
                    <div className="font-medium text-gray-700 dark:text-gray-300">{r2Percent}%</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ChartWrapper
      title="Trend Forecast"
      footer={
        <div className="w-full">
          <div className="text-xs mb-1">
            {`Method: ${method === 'linear' ? 'Linear Regression' : 'Exponential Smoothing'} | Granularity: ${granularity} | Forecast Periods: ${forecastPeriods}`}
          </div>
          {renderStatistics()}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <RechartsTooltip 
            formatter={(value: any, name: any) => {
              if (value === null) return ['N/A', ''];
              // Convert name to string to ensure string methods work
              const nameStr = String(name);
              const isActual = nameStr.includes('Actual');
              const nameWithoutPrefix = nameStr.replace(/(Actual: |Forecast: )/, '');
              return [value, `${isActual ? 'Actual' : 'Forecast'}: ${nameWithoutPrefix}`];
            }} 
          />
          <Legend />
          
          {/* Add a reference line at the forecast transition point */}
          {chartData.length > 0 && chartData.findIndex(item => 
            names.some(name => item[`actual_${name}`] === null && item[`forecast_${name}`] !== null)
          ) > 0 && (
            <ReferenceLine
              x={chartData.find(item => 
                names.some(name => item[`actual_${name}`] !== null && item[`forecast_${name}`] !== null)
              )?.period}
              stroke="#888"
              strokeDasharray="3 3"
            >
              <Label value="Forecast Start" position="top" fill="#888" fontSize={12} />
            </ReferenceLine>
          )}
          
          {names.map((name, idx) => (
            <Fragment key={name}>
              <Line
                type="monotone"
                dataKey={`actual_${name}`}
                stroke={COLORS[idx % COLORS.length]}
                name={`Actual: ${name}`}
                dot={{ r: 1 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey={`forecast_${name}`}
                stroke={COLORS[idx % COLORS.length]}
                name={`Forecast: ${name}`}
                strokeDasharray="5 5"
                dot={{ r: 2, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </Fragment>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default TrendForecastChart; 