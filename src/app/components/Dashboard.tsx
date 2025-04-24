import React from 'react';
import MonthlyTicketsChart from './charts/MonthlyTicketsChart';
import AgentDistributionChart from './charts/AgentDistributionChart';
import CategoryDistributionChart from './charts/CategoryDistributionChart';
import TeamDistributionChart from './charts/TeamDistributionChart';
import SummaryStatsCard from './charts/SummaryStatsCard';
import { useTickets } from '@/lib/contexts/TicketContext';

const Dashboard: React.FC = () => {
  const { tickets, filteredTickets } = useTickets();
  
  if (!tickets || tickets.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to Ticket Analytics</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Get started by uploading your Freshservice CSV export using the "Upload Data" button in the sidebar.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md text-sm text-blue-800 dark:text-blue-200">
            <h3 className="font-semibold mb-2">Required CSV Format:</h3>
            <p className="mb-2">Make sure your export includes these columns:</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>Created Date</li>
              <li>Groups</li>
              <li>ID</li>
              <li>Agent Name</li>
              <li>Category</li>
              <li>Subject</li>
              <li>Source</li>
              <li>Priority</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full p-4">
      <SummaryStatsCard />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="h-96">
          <MonthlyTicketsChart />
        </div>
        <div className="h-96">
          <TeamDistributionChart />
        </div>
        <div className="h-96">
          <AgentDistributionChart />
        </div>
        <div className="h-96">
          <CategoryDistributionChart />
        </div>
      </div>
      
      {filteredTickets && filteredTickets.length === 0 && tickets.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md">
          <p className="text-center">No tickets match your current filter criteria. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 