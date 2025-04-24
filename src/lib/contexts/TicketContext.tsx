import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { Ticket, FilterOptions } from '../types';
import { 
  processTicketData, 
  filterTickets, 
  getUniqueValues,
  groupTicketsByMonth,
  groupTicketsByTeam,
  groupTicketsByAgent,
  groupTicketsByCategory,
  groupTicketsByMonthAndAgent,
  groupTicketsByMonthAndTeam,
  groupTicketsByWeek,
  groupTicketsByWeekAndAgent,
  groupTicketsByWeekAndTeam
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
  
  // Unique filter options
  uniqueGroups: string[];
  uniqueCategories: string[];
  uniqueAgents: string[];
  uniqueSources: string[];
  uniquePriorities: string[];
  
  // Monthly aggregated data
  monthlyData: any[];
  teamData: any[];
  agentData: any[];
  categoryData: any[];
  monthlyAgentData: { [yearMonth: string]: { [agentName: string]: number } };
  monthlyTeamData: { [yearMonth: string]: { [teamName: string]: number } };
  
  // Weekly aggregated data
  weeklyData: any[];
  weeklyAgentData: { [yearWeek: string]: { [agentName: string]: number } };
  weeklyTeamData: { [yearWeek: string]: { [teamName: string]: number } };
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

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [filters, setFiltersState] = useState<FilterOptions>(defaultFilters);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
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
  const uniqueGroups = useMemo(() => getUniqueValues(tickets, 'group'), [tickets]);
  const uniqueCategories = useMemo(() => getUniqueValues(tickets, 'category'), [tickets]);
  const uniqueAgents = useMemo(() => getUniqueValues(tickets, 'agentName'), [tickets]);
  const uniqueSources = useMemo(() => getUniqueValues(tickets, 'source'), [tickets]);
  const uniquePriorities = useMemo(() => getUniqueValues(tickets, 'priority'), [tickets]);
  
  // Monthly aggregated data
  const monthlyData = useMemo(() => groupTicketsByMonth(filteredTickets), [filteredTickets]);
  const teamData = useMemo(() => groupTicketsByTeam(filteredTickets), [filteredTickets]);
  const agentData = useMemo(() => groupTicketsByAgent(filteredTickets), [filteredTickets]);
  const categoryData = useMemo(() => groupTicketsByCategory(filteredTickets), [filteredTickets]);
  const monthlyAgentData = useMemo(() => groupTicketsByMonthAndAgent(filteredTickets), [filteredTickets]);
  const monthlyTeamData = useMemo(() => groupTicketsByMonthAndTeam(filteredTickets), [filteredTickets]);
  
  // Weekly aggregated data
  const weeklyData = useMemo(() => groupTicketsByWeek(filteredTickets), [filteredTickets]);
  const weeklyAgentData = useMemo(() => groupTicketsByWeekAndAgent(filteredTickets), [filteredTickets]);
  const weeklyTeamData = useMemo(() => groupTicketsByWeekAndTeam(filteredTickets), [filteredTickets]);
  
  const setFilters = (newFilters: Partial<FilterOptions>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };
  
  const resetFilters = () => {
    setFiltersState(defaultFilters);
  };
  
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
        uniqueGroups,
        uniqueCategories,
        uniqueAgents,
        uniqueSources,
        uniquePriorities,
        monthlyData,
        teamData,
        agentData,
        categoryData,
        monthlyAgentData,
        monthlyTeamData,
        weeklyData,
        weeklyAgentData,
        weeklyTeamData
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