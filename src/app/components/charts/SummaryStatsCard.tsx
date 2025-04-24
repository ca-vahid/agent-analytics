"use client";

import React from 'react';
import { useTickets } from '@/lib/contexts/TicketContext';
import { formatNumber } from '@/lib/utils';
import { 
  TicketIcon, 
  UserGroupIcon, 
  UserIcon, 
  TagIcon, 
  BriefcaseIcon 
} from '@heroicons/react/24/outline';

const SummaryStatsCard: React.FC = () => {
  const { 
    filteredTickets, 
    tickets,
    uniqueGroups,
    uniqueCategories,
    uniqueAgents 
  } = useTickets();
  
  // Calculate percentage change from total to filtered
  const calculatePercentage = () => {
    if (!tickets || tickets.length === 0) return 0;
    if (!filteredTickets) return 0;
    if (tickets.length === filteredTickets.length) return 100;
    
    return Math.round((filteredTickets.length / tickets.length) * 100);
  };
  
  const statsItems = [
    {
      label: 'Total Tickets',
      value: formatNumber(filteredTickets?.length || 0),
      change: `${calculatePercentage()}% of total`,
      icon: <TicketIcon className="h-6 w-6 text-blue-500" />,
    },
    {
      label: 'Teams',
      value: uniqueGroups?.length || 0,
      icon: <UserGroupIcon className="h-6 w-6 text-emerald-500" />,
    },
    {
      label: 'Categories',
      value: uniqueCategories?.length || 0,
      icon: <TagIcon className="h-6 w-6 text-purple-500" />,
    },
    {
      label: 'Agents',
      value: uniqueAgents?.length || 0,
      icon: <UserIcon className="h-6 w-6 text-amber-500" />,
    }
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsItems.map((item, index) => (
          <div 
            key={index} 
            className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex flex-col"
          >
            <div className="flex items-center mb-2">
              {item.icon}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {item.label}
              </span>
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {item.value}
            </div>
            {item.change && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {item.change}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {(!tickets || tickets.length === 0) && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
          No data loaded. Please upload a CSV file to get started.
        </div>
      )}
    </div>
  );
};

export default SummaryStatsCard; 