import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { set, get, del, clear } from 'idb-keyval';
import { Ticket, FilterOptions, TicketAggregate, TimeSeriesData } from '../types';
import { 
  processTicketData, 
  filterTickets, 
  getUniqueValues,
  groupTicketsByMonth,
  groupTicketsByTeam,
  groupTicketsByAgent,
  groupTicketsByCategory,
  groupTicketsByStatus,
  groupTicketsByPriority,
  groupTicketsByMonthAndAgent,
  groupTicketsByMonthAndTeam,
  groupTicketsByWeek,
  groupTicketsByWeekAndAgent,
  groupTicketsByWeekAndTeam,
  extractYearMonth
} from '../utils';

interface TicketContextType {
  rawData: any[];
  tickets: Ticket[];
  filteredTickets: Ticket[];
  filters: FilterOptions;
  isLoading: boolean;
  setRawData: (data: any[]) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  resetData: () => void;
  
  // Unique filter options
  uniqueGroups: string[];
  uniqueCategories: string[];
  uniqueAgents: string[];
  uniqueSources: string[];
  uniquePriorities: string[];
  uniqueStatuses: string[];
  
  // Monthly aggregated data
  monthlyData: any[];
  teamData: TicketAggregate[];
  agentData: TicketAggregate[];
  categoryData: TicketAggregate[];
  statusData: TicketAggregate[];
  priorityData: TicketAggregate[];
  monthlyAgentData: { [yearMonth: string]: { [agentName: string]: number } };
  monthlyTeamData: { [yearMonth: string]: { [teamName: string]: number } };
  
  // Weekly aggregated data
  weeklyData: any[];
  weeklyAgentData: { [yearWeek: string]: { [agentName: string]: number } };
  weeklyTeamData: { [yearWeek: string]: { [teamName: string]: number } };

  // Time series data
  timeseriesData: TimeSeriesData[];
}

const defaultFilters: FilterOptions = {
  dateRange: [null, null],
  groups: [],
  categories: [],
  agents: [],
  sources: [],
  priorities: []
};

const TicketContext = createContext<TicketContextType | undefined>(undefined);

// Keys for storage
const TICKET_DATA_KEY = 'ticketData';
const SESSION_ID_KEY = 'ticketSessionId';

// Create or retrieve a persistent sessionId for this browser session
const getSessionId = () => {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('ticketAnalyticsSessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('ticketAnalyticsSessionId', sessionId);
    }
    return sessionId;
  }
  return '';
};

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the current session ID - this will be different for each browser session
  const currentSessionId = getSessionId();
  
  // Initialize state from IndexedDB
  const [rawData, setRawDataState] = useState<any[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  
  // Load data from IndexedDB on initial mount
  useEffect(() => {
    async function loadFromDb() {
      try {
        // Get the saved session ID
        const savedSessionId = await get(SESSION_ID_KEY);
        
        // Only load data if it's from the current session
        if (savedSessionId === currentSessionId) {
          const data = await get(TICKET_DATA_KEY);
          if (data && Array.isArray(data)) {
            console.log(`Loaded ${data.length} records from IndexedDB`);
            setRawDataState(data);
          }
        } else if (savedSessionId) {
          console.log('Data found from a different session - starting fresh');
          // Clear old data
          await clear();
        }
      } catch (err) {
        console.error('Error loading from IndexedDB:', err);
      } finally {
        setIsDbLoaded(true);
      }
    }
    
    loadFromDb();
  }, [currentSessionId]);

  const [filters, setFiltersState] = useState<FilterOptions>(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = sessionStorage.getItem('ticketFilters');
      return savedFilters ? JSON.parse(savedFilters) : defaultFilters;
    }
    return defaultFilters;
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Helper to clear storage
  const clearStorage = async () => {
    try {
      // Clear IndexedDB
      await clear();
      console.log('Cleared IndexedDB storage');
    } catch (err) {
      console.warn('Error clearing storage:', err);
    }
  };

  // Public facing function to reset all data
  const resetData = async () => {
    await clearStorage();
    setRawDataState([]);
  };

  // Save to IndexedDB
  const setRawData = async (data: any[]) => {
    setRawDataState(data);
    
    if (typeof window === 'undefined' || !data) return;
    
    try {
      // Save session ID
      await set(SESSION_ID_KEY, currentSessionId);
      
      // Save data
      await set(TICKET_DATA_KEY, data);
      console.log(`Saved ${data.length} records to IndexedDB`);
    } catch (err) {
      console.warn('Error saving to IndexedDB, using in-memory only:', err);
    }
  };

  const setFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ticketFilters', JSON.stringify(updatedFilters));
    }
  };
  
  const resetFilters = () => {
    setFiltersState(defaultFilters);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ticketFilters', JSON.stringify(defaultFilters));
    }
  };
  
  // Process raw data into normalized ticket format
  useEffect(() => {
    if (rawData.length > 0) {
      setIsLoading(true);
      try {
        const processed = processTicketData(rawData);
        setTickets(processed);
        setFilteredTickets(processed);
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing ticket data:', error);
        setIsLoading(false);
      }
    }
  }, [rawData]);
  
  // Apply filters whenever they change
  useEffect(() => {
    setFilteredTickets(filterTickets(tickets, filters));
  }, [tickets, filters]);
  
  // Extract unique values for filters
  const uniqueGroups = useMemo(() => {
    const allGroups = getUniqueValues(tickets, 'group');
    const coreshack = 'Coreshack';
    const itTeam = 'IT Team';
    // All teams except Coreshack
    const itSubteams = allGroups.filter(g => g !== coreshack);
    // Place IT Team and Coreshack at the top, then all subteams
    return [itTeam, coreshack, ...itSubteams];
  }, [tickets]);
  const uniqueCategories = useMemo(() => getUniqueValues(tickets, 'category'), [tickets]);
  const uniqueAgents = useMemo(() => getUniqueValues(tickets, 'agentName'), [tickets]);
  const uniqueSources = useMemo(() => getUniqueValues(tickets, 'source'), [tickets]);
  const uniquePriorities = useMemo(() => getUniqueValues(tickets, 'priority'), [tickets]);
  const uniqueStatuses = useMemo(() => getUniqueValues(tickets, 'status'), [tickets]);
  
  // Monthly aggregated data
  const monthlyData = useMemo(() => groupTicketsByMonth(filteredTickets), [filteredTickets]);
  const teamData = useMemo(() => groupTicketsByTeam(filteredTickets), [filteredTickets]);
  const agentData = useMemo(() => groupTicketsByAgent(filteredTickets), [filteredTickets]);
  const categoryData = useMemo(() => groupTicketsByCategory(filteredTickets), [filteredTickets]);
  const statusData = useMemo(() => groupTicketsByStatus(filteredTickets), [filteredTickets]);
  const priorityData = useMemo(() => groupTicketsByPriority(filteredTickets), [filteredTickets]);
  const monthlyAgentData = useMemo(() => groupTicketsByMonthAndAgent(filteredTickets), [filteredTickets]);
  const monthlyTeamData = useMemo(() => groupTicketsByMonthAndTeam(filteredTickets), [filteredTickets]);
  
  // Weekly aggregated data
  const weeklyData = useMemo(() => groupTicketsByWeek(filteredTickets), [filteredTickets]);
  const weeklyAgentData = useMemo(() => groupTicketsByWeekAndAgent(filteredTickets), [filteredTickets]);
  const weeklyTeamData = useMemo(() => groupTicketsByWeekAndTeam(filteredTickets), [filteredTickets]);
  
  // Add timeseriesData calculation
  const timeseriesData = useMemo(() => 
    groupTicketsByDate(filteredTickets),
  [filteredTickets]);
  
  return (
    <TicketContext.Provider
      value={{
        rawData,
        tickets,
        filteredTickets,
        filters,
        isLoading,
        setRawData,
        setFilters,
        resetFilters,
        resetData,
        uniqueGroups,
        uniqueCategories,
        uniqueAgents,
        uniqueSources,
        uniquePriorities,
        uniqueStatuses,
        monthlyData,
        teamData,
        agentData,
        categoryData,
        statusData,
        priorityData,
        monthlyAgentData,
        monthlyTeamData,
        weeklyData,
        weeklyAgentData,
        weeklyTeamData,
        timeseriesData
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};

// Add this function after the other groupBy functions
function groupTicketsByDate(tickets: Ticket[]): TimeSeriesData[] {
  const dateMap = new Map<string, { created: number; resolved: number }>();

  // Process tickets by date
  tickets.forEach(ticket => {
    const date = ticket.createdDate.split('T')[0]; // Get just the date part
    const current = dateMap.get(date) || { created: 0, resolved: 0 };
    
    // Safely check if status exists and is 'resolved'
    const status = (ticket.status || '').toLowerCase();
    if (status === 'resolved') {
      current.resolved++;
    }
    current.created++;
    
    dateMap.set(date, current);
  });

  // Convert to array and sort by date
  return Array.from(dateMap.entries())
    .map(([date, counts]) => ({
      date,
      ...counts
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
} 