import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { 
  MoonIcon, 
  SunIcon, 
  ChartBarSquareIcon,
  CalendarIcon,
  TrashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useTickets } from '@/lib/contexts/TicketContext';
import { usePathname } from 'next/navigation';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { tickets, resetData } = useTickets();
  const pathname = usePathname();
  
  // Format the date range of imported tickets
  const getTicketDateRange = () => {
    if (tickets.length === 0) return null;
    // Sort tickets by createdDate
    const sorted = [...tickets].sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
    const first = new Date(sorted[0].createdDate);
    const last = new Date(sorted[sorted.length - 1].createdDate);
    const options = { year: 'numeric', month: 'short', day: 'numeric' } as const;
    return `${first.toLocaleDateString('en-US', options)} - ${last.toLocaleDateString('en-US', options)}`;
  };

  // Format the current date/time (small, less prominent)
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col h-auto">
          {/* Top row with logo and controls */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center bg-blue-500 dark:bg-blue-600 text-white p-1.5 rounded-lg shadow-sm">
                <ChartBarSquareIcon className="h-5 w-5" />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                Ticket Analytics
              </h1>
              {tickets.length > 0 && (
                <div className="hidden md:block ml-8 mt-1.5 mb-1">
                  <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-gray-700 dark:text-gray-200 px-5 py-1.5 rounded-md shadow-sm min-w-[340px]">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Ticket Date Range:</span>
                    </div>
                    <span className="text-base font-semibold ml-2">{getTicketDateRange()}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
                {tickets.length > 0 ? (
                  <span className="font-medium">{tickets.length.toLocaleString()} tickets</span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 italic">No data loaded</span>
                )}
              </div>
              
              <Link href="/about" className="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="About">
                <InformationCircleIcon className="h-5 w-5" />
              </Link>
              
              <Link href="/trends" className="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Trends">
                <CalendarIcon className="h-5 w-5" />
              </Link>
              
              {tickets.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                      resetData();
                    }
                  }}
                  className="inline-flex items-center justify-center p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  aria-label="Reset Data"
                  title="Reset Data"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5 text-amber-500" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Navigation tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <Link 
              href="/" 
              className={`inline-flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
                pathname === '/' || pathname === '' 
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <ChartBarSquareIcon className="h-5 w-5 mr-2" />
              Dashboard
            </Link>
            
            <Link 
              href="/trends" 
              className={`inline-flex items-center px-4 py-2 border-b-2 font-medium text-sm ${
                pathname === '/trends' 
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Forecast
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 