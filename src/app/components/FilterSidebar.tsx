import React, { useState, Fragment, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTickets } from '@/lib/contexts/TicketContext';
import { FilterOptions } from '@/lib/types';
import { 
  AdjustmentsHorizontalIcon, 
  CalendarIcon, 
  XMarkIcon, 
  ChevronDownIcon, 
  CheckIcon,
  ArrowPathIcon,
  UserGroupIcon,
  TagIcon,
  UserIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  DocumentPlusIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Transition, Popover, Disclosure } from '@headlessui/react';
import FileUploader from './FileUploader';

interface FilterSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, value, onRemove }) => {
  return (
    <div className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm text-blue-800 dark:text-blue-300 mr-2 mb-2 group transition-all duration-200 hover:bg-blue-200 dark:hover:bg-blue-800/60">
      <span className="text-xs text-blue-600 dark:text-blue-400 mr-1 font-medium">{label}:</span>
      <span className="font-medium">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none focus:bg-blue-500 focus:text-white transition-colors"
      >
        <span className="sr-only">Remove filter</span>
        <XMarkIcon className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
};

const MultiSelectDropdown: React.FC<{
  label: string,
  icon: React.ReactNode, 
  options: string[],
  selectedValues: string[],
  onChange: (values: string[]) => void,
  isCollapsed?: boolean
}> = ({ label, icon, options, selectedValues, onChange, isCollapsed }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  // If collapsed, render just the icon with a badge
  if (isCollapsed) {
    return (
      <div className="mb-4 relative">
        <Popover>
          {({ open }) => (
            <>
              <Popover.Button className={`w-full flex justify-center items-center p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow focus:outline-none ${
                selectedValues.length > 0 
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              } transition-all duration-200`}>
                <span className="relative">
                  {icon}
                  {selectedValues.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-none relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                </span>
              </Popover.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute z-10 left-14 w-60 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 p-2 focus:outline-none">
                  <div className="flex justify-between items-center mb-2 p-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    {selectedValues.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => onChange([])}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder={`Search ${label.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {filteredOptions.length === 0 ? (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400 italic">
                        No matching {label.toLowerCase()} found
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredOptions.map(option => (
                          <div 
                            key={option}
                            onClick={() => toggleOption(option)}
                            className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                              selectedValues.includes(option)
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            } transition-colors duration-150`}
                          >
                            <div className={`flex-shrink-0 h-4 w-4 mr-2 rounded border ${
                              selectedValues.includes(option)
                                ? 'bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600'
                                : 'border-gray-300 dark:border-gray-600'
                            } flex items-center justify-center transition-colors duration-150`}>
                              {selectedValues.includes(option) && (
                                <CheckIcon className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="truncate">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    );
  }

  // Regular expanded view
  return (
    <Disclosure as="div" className="mb-4">
      {({ open }) => (
        <>
          <Disclosure.Button className="w-full flex justify-between items-center px-4 py-3 text-left rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition-all duration-200">
            <div className="flex items-center">
              <span className="mr-3 text-blue-500 dark:text-blue-400">
                {icon}
              </span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {label}
                {selectedValues.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                    {selectedValues.length}
                  </span>
                )}
              </span>
            </div>
            <ChevronDownIcon
              className={`${
                open ? 'rotate-180 transform' : ''
              } h-5 w-5 text-gray-500 transition-transform duration-200`}
            />
          </Disclosure.Button>
          
          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="px-1 pt-3 pb-2 text-sm">
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {selectedValues.length > 0 && (
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedValues.length} selected
                  </span>
                  <button 
                    type="button"
                    onClick={() => onChange([])}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
              
              <div className="max-h-60 overflow-y-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {filteredOptions.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400 italic">
                    No matching {label.toLowerCase()} found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredOptions.map(option => (
                      <div 
                        key={option}
                        onClick={() => toggleOption(option)}
                        className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                          selectedValues.includes(option)
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        } transition-colors duration-150`}
                      >
                        <div className={`flex-shrink-0 h-4 w-4 mr-2 rounded border ${
                          selectedValues.includes(option)
                            ? 'bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } flex items-center justify-center transition-colors duration-150`}>
                          {selectedValues.includes(option) && (
                            <CheckIcon className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="truncate">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const { 
    filters, 
    setFilters, 
    resetFilters, 
    uniqueGroups, 
    uniqueCategories, 
    uniqueAgents,
    uniqueSources,
    uniquePriorities,
    tickets,
    filteredTickets
  } = useTickets();
  
  const [showUploader, setShowUploader] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setFilters({ dateRange: dates });
  };
  
  // Calculate active filters count
  const activeFiltersCount = [
    filters.dateRange[0] && filters.dateRange[1] ? 1 : 0,
    filters.groups.length,
    filters.categories.length,
    filters.agents.length,
    filters.sources.length,
    filters.priorities.length
  ].reduce((a, b) => a + b, 0);
  
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Prevent hydration errors by using a client-only div wrapper
  if (!isMounted) {
    return (
      <div className={`w-full h-full bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 md:mb-2">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-blue-500" />
              Filters
            </h2>
          )}
          
          <div className="flex space-x-1">
            <button 
              onClick={onToggle}
              className="md:hidden p-1.5 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Static placeholder content for server rendering */}
        <div className={`overflow-y-auto space-y-4 flex-grow scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${isCollapsed ? 'px-2' : 'px-4'}`}></div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden flex flex-col transition-all duration-300`}>
      {/* Header with toggle button for mobile */}
      <div className="flex items-center justify-between p-4 md:mb-2">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-blue-500" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                {activeFiltersCount}
              </span>
            )}
          </h2>
        )}
        
        <div className="flex space-x-1">
          {/* Mobile Toggle Button */}
          <button 
            onClick={onToggle}
            className="md:hidden p-1.5 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </button>
          
          {/* Conditionally render reset button */}
          {activeFiltersCount > 0 && !isCollapsed && (
            <button 
              onClick={resetFilters}
              className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Reset all filters"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
          
          {!isCollapsed && (
            <button 
              onClick={() => setShowUploader(!showUploader)}
              className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
              title={showUploader ? "Hide uploader" : "Upload data"}
            >
              {showUploader ? (
                <XMarkIcon className="h-4 w-4" />
              ) : (
                <ArrowDownTrayIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {tickets.length === 0 && !showUploader && !isCollapsed ? (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 shadow-sm mx-4">
          <div className="flex items-start">
            <DocumentPlusIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">No data loaded</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">Upload a CSV file to get started with your analysis</p>
              <button 
                onClick={() => setShowUploader(true)}
                className="inline-flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Upload Data
              </button>
            </div>
          </div>
        </div>
      ) : null}
      
      {showUploader && !isCollapsed && <div className="px-4"><FileUploader /></div>}
      
      {/* Active filters display */}
      {activeFiltersCount > 0 && !isCollapsed && (
        <div className="mb-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Filters</h3>
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap">
            {filters.dateRange[0] && filters.dateRange[1] && (
              <FilterChip
                label="Date"
                value={`${formatDate(filters.dateRange[0])} - ${formatDate(filters.dateRange[1])}`}
                onRemove={() => setFilters({ dateRange: [null, null] })}
              />
            )}
            
            {filters.groups.map(group => (
              <FilterChip
                key={group}
                label="Team"
                value={group}
                onRemove={() => setFilters({ 
                  groups: filters.groups.filter(g => g !== group) 
                })}
              />
            ))}
            
            {filters.categories.map(category => (
              <FilterChip
                key={category}
                label="Category"
                value={category}
                onRemove={() => setFilters({ 
                  categories: filters.categories.filter(c => c !== category) 
                })}
              />
            ))}
            
            {filters.agents.map(agent => (
              <FilterChip
                key={agent}
                label="Agent"
                value={agent}
                onRemove={() => setFilters({ 
                  agents: filters.agents.filter(a => a !== agent) 
                })}
              />
            ))}
            
            {filters.sources.map(source => (
              <FilterChip
                key={source}
                label="Source"
                value={source}
                onRemove={() => setFilters({ 
                  sources: filters.sources.filter(s => s !== source) 
                })}
              />
            ))}
            
            {filters.priorities.map(priority => (
              <FilterChip
                key={priority}
                label="Priority"
                value={priority}
                onRemove={() => setFilters({ 
                  priorities: filters.priorities.filter(p => p !== priority) 
                })}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Date Range Picker */}
      {!isCollapsed ? (
        <Popover className="relative mb-4 px-4">
          {({ open }) => (
            <>
              <Popover.Button 
                className={`w-full flex justify-between items-center px-4 py-3 text-left rounded-lg ${
                  open ? 'ring-2 ring-blue-500 bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/70'
                } shadow-sm focus:outline-none transition-all duration-200`}
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Date Range
                  </span>
                </div>
                {filters.dateRange[0] && filters.dateRange[1] ? (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                ) : (
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180 transform' : ''
                    } h-5 w-5 text-gray-500`}
                  />
                )}
              </Popover.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute z-10 mt-2 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 p-4 focus:outline-none">
                  <div className="text-center">
                    <DatePicker
                      selectsRange={true}
                      startDate={filters.dateRange[0]}
                      endDate={filters.dateRange[1]}
                      onChange={handleDateRangeChange}
                      inline
                      className="border-none !bg-transparent"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => setFilters({ dateRange: [null, null] })}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Clear dates
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {filters.dateRange[0] && filters.dateRange[1]
                        ? `${formatDate(filters.dateRange[0])} - ${formatDate(filters.dateRange[1])}`
                        : 'Select date range'}
                    </span>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      ) : (
        <Popover className="relative mb-4 px-2">
          {({ open }) => (
            <>
              <Popover.Button 
                className={`w-full flex justify-center items-center p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow focus:outline-none ${
                  filters.dateRange[0] && filters.dateRange[1]
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                } transition-all duration-200`}
                title="Date Range"
              >
                <span className="relative">
                  <CalendarIcon className="h-5 w-5" />
                  {filters.dateRange[0] && filters.dateRange[1] && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-none relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                </span>
              </Popover.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute z-10 left-14 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 p-4 focus:outline-none">
                  <div className="text-center">
                    <DatePicker
                      selectsRange={true}
                      startDate={filters.dateRange[0]}
                      endDate={filters.dateRange[1]}
                      onChange={handleDateRangeChange}
                      inline
                      className="border-none !bg-transparent"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => setFilters({ dateRange: [null, null] })}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Clear dates
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {filters.dateRange[0] && filters.dateRange[1]
                        ? `${formatDate(filters.dateRange[0])} - ${formatDate(filters.dateRange[1])}`
                        : 'Select date range'}
                    </span>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      )}
      
      {/* Filter Sections */}
      <div className={`overflow-y-auto space-y-4 flex-grow scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <MultiSelectDropdown
          label="Teams"
          icon={<UserGroupIcon className="h-5 w-5" />}
          options={uniqueGroups || []}
          selectedValues={filters.groups}
          onChange={(values) => setFilters({ groups: values })}
          isCollapsed={isCollapsed}
        />
        
        <MultiSelectDropdown
          label="Categories"
          icon={<TagIcon className="h-5 w-5" />}
          options={uniqueCategories || []}
          selectedValues={filters.categories}
          onChange={(values) => setFilters({ categories: values })}
          isCollapsed={isCollapsed}
        />
        
        <MultiSelectDropdown
          label="Agents"
          icon={<UserIcon className="h-5 w-5" />}
          options={uniqueAgents || []}
          selectedValues={filters.agents}
          onChange={(values) => setFilters({ agents: values })}
          isCollapsed={isCollapsed}
        />
        
        <MultiSelectDropdown
          label="Sources"
          icon={<EnvelopeIcon className="h-5 w-5" />}
          options={uniqueSources || []}
          selectedValues={filters.sources}
          onChange={(values) => setFilters({ sources: values })}
          isCollapsed={isCollapsed}
        />
        
        <MultiSelectDropdown
          label="Priorities"
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          options={uniquePriorities || []}
          selectedValues={filters.priorities}
          onChange={(values) => setFilters({ priorities: values })}
          isCollapsed={isCollapsed}
        />
      </div>
      
      {tickets.length > 0 && !isCollapsed && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-4 pb-4">
          <div>
            <p>Total: <span className="font-semibold text-gray-700 dark:text-gray-300">{tickets.length.toLocaleString()}</span></p>
            <p>Filtered: <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredTickets?.length.toLocaleString()}</span></p>
          </div>
          <div className="text-right">
            {filteredTickets && tickets.length > 0 && (
              <p className="font-medium text-blue-600 dark:text-blue-400">
                {Math.round((filteredTickets.length / tickets.length) * 100)}%
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar; 