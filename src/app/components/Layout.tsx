import React, { useState } from 'react';
import Header from './Header';
import FilterSidebar from './FilterSidebar';
import Dashboard from './Dashboard';
// Remove ThemeProvider and TicketProvider imports if they are not used elsewhere in this file
// import { ThemeProvider } from '@/lib/contexts/ThemeContext'; 
// import { TicketProvider } from '@/lib/contexts/TicketContext';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    // Remove ThemeProvider and TicketProvider wrappers
    // <ThemeProvider>
    //   <TicketProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
          <Header />
          
          <div className="flex-grow grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 p-4 max-h-[calc(100vh-4rem)] overflow-hidden relative">
            {/* Sidebar Container */}
            <div className={`transition-all duration-300 ease-in-out ${
              sidebarCollapsed 
                ? 'md:w-16 w-full' 
                : 'md:w-[270px] w-full'
            } relative h-[calc(100vh-6rem)] md:overflow-visible overflow-y-auto rounded-xl shadow-sm`}>
              
              {/* Sidebar Toggle Button - Desktop */}
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute right-0 top-1/2 -mr-3 z-10 rounded-full p-1 bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors hidden md:flex"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </button>
              
              <FilterSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            </div>
            
            <div className="h-[calc(100vh-6rem)] overflow-y-auto rounded-xl bg-white dark:bg-gray-800/30 shadow-sm p-2">
              <Dashboard />
            </div>
          </div>
        </div>
    //   </TicketProvider>
    // </ThemeProvider>
  );
};

export default Layout; 