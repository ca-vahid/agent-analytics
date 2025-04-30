import { format, parseISO, startOfWeek, getISOWeek } from 'date-fns';
import { Ticket, MonthlyTicketCount, TicketAggregate, FilterOptions } from './types';

/**
 * Format a date string into a readable format
 * @param dateStr - The date string to format
 * @param short - Whether to use short format (e.g., "Jan 1" vs "January 1, 2023")
 */
export function formatDate(dateStr: string, short: boolean = false): string {
  try {
    const date = typeof dateStr === 'string' 
      ? parseISO(dateStr) 
      : dateStr;
    return format(date, short ? 'MMM d' : 'MMMM d, yyyy');
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Processes raw ticket data from CSV and converts it to our normalized format
 */
export function processTicketData(data: any[]): Ticket[] {
  return data.map(row => {
    // Format could be either "2023-01-01 01:12:19 PM" or ISO format
    let dateStr = row['Created Date'] || row['createdDate'];
    try {
      // Try to parse the date and format to ISO
      const dateParts = dateStr.split(' ');
      const date = dateParts[0];
      const time = dateParts[1];
      const period = dateParts[2];
      
      // Format the date to ISO format
      const parsedDate = new Date(`${date} ${time} ${period}`);
      dateStr = parsedDate.toISOString();
    } catch (e) {
      // If parsing fails, keep as is (might already be ISO format)
    }

    // Extract year-month for aggregation
    const yearMonth = extractYearMonth(dateStr);
    
    return {
      createdDate: dateStr,
      group: row['Groups'] || row['group'],
      id: row['ID'] || row['id'],
      agentName: row['Agent Name'] || row['agentName'],
      category: row['Category'] || row['category'],
      subject: row['Subject'] || row['subject'],
      source: row['Source'] || row['source'],
      priority: row['Priority'] || row['priority'],
      status: row['Status'] || row['status'],
      yearMonth
    };
  });
}

/**
 * Extract year-month string from date (e.g., "2023-01")
 */
export function extractYearMonth(dateStr: string): string {
  try {
    const date = typeof dateStr === 'string' 
      ? parseISO(dateStr) 
      : dateStr;
    return format(date, 'yyyy-MM');
  } catch (e) {
    return 'Unknown';
  }
}

/**
 * Extract year-week string from date (e.g., "2023-W01")
 */
export function extractYearWeek(dateStr: string): string {
  try {
    const date = typeof dateStr === 'string' 
      ? parseISO(dateStr) 
      : dateStr;
    const weekNum = getISOWeek(date);
    const year = format(date, 'yyyy');
    return `${year}-W${weekNum.toString().padStart(2, '0')}`;
  } catch (e) {
    return 'Unknown';
  }
}

/**
 * Group tickets by month and count
 */
export function groupTicketsByMonth(tickets: Ticket[]): MonthlyTicketCount[] {
  const monthCounts = new Map<string, number>();
  
  tickets.forEach(ticket => {
    const yearMonth = ticket.yearMonth || 'Unknown';
    monthCounts.set(yearMonth, (monthCounts.get(yearMonth) || 0) + 1);
  });
  
  return Array.from(monthCounts.entries())
    .map(([yearMonth, count]) => ({ yearMonth, count }))
    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

/**
 * Group tickets by week and count
 */
export function groupTicketsByWeek(tickets: Ticket[]): { yearWeek: string, count: number }[] {
  const weekCounts = new Map<string, number>();
  
  tickets.forEach(ticket => {
    // Extract year-week
    const yearWeek = extractYearWeek(ticket.createdDate);
    weekCounts.set(yearWeek, (weekCounts.get(yearWeek) || 0) + 1);
  });
  
  return Array.from(weekCounts.entries())
    .map(([yearWeek, count]) => ({ yearWeek, count }))
    .sort((a, b) => a.yearWeek.localeCompare(b.yearWeek));
}

/**
 * Group tickets by month and agent, then count
 */
export function groupTicketsByMonthAndAgent(tickets: Ticket[]): { [yearMonth: string]: { [agentName: string]: number } } {
  const monthAgentCounts: { [yearMonth: string]: { [agentName: string]: number } } = {};

  tickets.forEach(ticket => {
    const yearMonth = ticket.yearMonth || 'Unknown';
    const agentName = ticket.agentName || 'Unknown';

    if (!monthAgentCounts[yearMonth]) {
      monthAgentCounts[yearMonth] = {};
    }
    if (!monthAgentCounts[yearMonth][agentName]) {
      monthAgentCounts[yearMonth][agentName] = 0;
    }
    monthAgentCounts[yearMonth][agentName]++;
  });

  return monthAgentCounts;
}

/**
 * Group tickets by week and agent, then count
 */
export function groupTicketsByWeekAndAgent(tickets: Ticket[]): { [yearWeek: string]: { [agentName: string]: number } } {
  const weekAgentCounts: { [yearWeek: string]: { [agentName: string]: number } } = {};

  tickets.forEach(ticket => {
    const yearWeek = extractYearWeek(ticket.createdDate);
    const agentName = ticket.agentName || 'Unknown';

    if (!weekAgentCounts[yearWeek]) {
      weekAgentCounts[yearWeek] = {};
    }
    if (!weekAgentCounts[yearWeek][agentName]) {
      weekAgentCounts[yearWeek][agentName] = 0;
    }
    weekAgentCounts[yearWeek][agentName]++;
  });

  return weekAgentCounts;
}

/**
 * Group tickets by month and team, then count
 */
export function groupTicketsByMonthAndTeam(tickets: Ticket[]): { [yearMonth: string]: { [teamName: string]: number } } {
  const monthTeamCounts: { [yearMonth: string]: { [teamName: string]: number } } = {};
  const coreshack = 'Coreshack';
  const itTeam = 'IT Team';

  tickets.forEach(ticket => {
    const yearMonth = ticket.yearMonth || 'Unknown';
    const teamName = ticket.group || 'Unknown';
    if (!monthTeamCounts[yearMonth]) {
      monthTeamCounts[yearMonth] = {};
    }
    // Aggregate all non-Coreshack teams under 'IT Team'
    if (teamName === coreshack) {
      if (!monthTeamCounts[yearMonth][coreshack]) {
        monthTeamCounts[yearMonth][coreshack] = 0;
      }
      monthTeamCounts[yearMonth][coreshack]++;
    } else {
      if (!monthTeamCounts[yearMonth][itTeam]) {
        monthTeamCounts[yearMonth][itTeam] = 0;
      }
      monthTeamCounts[yearMonth][itTeam]++;
      // Optionally, keep individual subteam counts as well
      if (!monthTeamCounts[yearMonth][teamName]) {
        monthTeamCounts[yearMonth][teamName] = 0;
      }
      monthTeamCounts[yearMonth][teamName]++;
    }
  });

  return monthTeamCounts;
}

/**
 * Group tickets by week and team, then count
 */
export function groupTicketsByWeekAndTeam(tickets: Ticket[]): { [yearWeek: string]: { [teamName: string]: number } } {
  const weekTeamCounts: { [yearWeek: string]: { [teamName: string]: number } } = {};
  const coreshack = 'Coreshack';
  const itTeam = 'IT Team';

  tickets.forEach(ticket => {
    const yearWeek = extractYearWeek(ticket.createdDate);
    const teamName = ticket.group || 'Unknown';
    if (!weekTeamCounts[yearWeek]) {
      weekTeamCounts[yearWeek] = {};
    }
    // Aggregate all non-Coreshack teams under 'IT Team'
    if (teamName === coreshack) {
      if (!weekTeamCounts[yearWeek][coreshack]) {
        weekTeamCounts[yearWeek][coreshack] = 0;
      }
      weekTeamCounts[yearWeek][coreshack]++;
    } else {
      if (!weekTeamCounts[yearWeek][itTeam]) {
        weekTeamCounts[yearWeek][itTeam] = 0;
      }
      weekTeamCounts[yearWeek][itTeam]++;
      // Optionally, keep individual subteam counts as well
      if (!weekTeamCounts[yearWeek][teamName]) {
        weekTeamCounts[yearWeek][teamName] = 0;
      }
      weekTeamCounts[yearWeek][teamName]++;
    }
  });

  return weekTeamCounts;
}

/**
 * Group tickets by group/team and count
 */
export function groupTicketsByTeam(tickets: Ticket[]): TicketAggregate[] {
  return groupTicketsBy(tickets, 'group');
}

/**
 * Group tickets by agent and count
 */
export function groupTicketsByAgent(tickets: Ticket[]): TicketAggregate[] {
  return groupTicketsBy(tickets, 'agentName');
}

/**
 * Group tickets by category and count
 */
export function groupTicketsByCategory(tickets: Ticket[]): TicketAggregate[] {
  return groupTicketsBy(tickets, 'category');
}

/**
 * Group tickets by status and count
 */
export function groupTicketsByStatus(tickets: Ticket[]): TicketAggregate[] {
  return groupTicketsBy(tickets, 'status');
}

/**
 * Groups tickets by priority and returns an array of objects with priority labels and counts
 */
export const groupTicketsByPriority = (tickets: Ticket[]): TicketAggregate[] => {
  const priorityCounts = tickets.reduce((acc, ticket) => {
    const priority = ticket.priority || 'Unassigned';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(priorityCounts).map(([priority, count]) => ({
    label: priority,
    count
  }));
};

/**
 * Generic function to group tickets by any property
 */
export function groupTicketsBy(tickets: Ticket[], field: keyof Ticket): TicketAggregate[] {
  const counts = new Map<string, number>();
  
  tickets.forEach(ticket => {
    const value = ticket[field] as string || 'Unknown';
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  
  const total = tickets.length;
  
  return Array.from(counts.entries())
    .map(([label, count]) => ({ 
      label, 
      count,
      percentage: Math.round((count / total) * 100) 
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Apply filters to ticket data
 */
export function filterTickets(tickets: Ticket[], filters: FilterOptions): Ticket[] {
  return tickets.filter(ticket => {
    // Date range filter
    if (filters.dateRange[0] && filters.dateRange[1]) {
      const ticketDate = new Date(ticket.createdDate);
      if (ticketDate < filters.dateRange[0] || ticketDate > filters.dateRange[1]) {
        return false;
      }
    }
    // Group filter
    if (filters.groups.length > 0) {
      const coreshack = 'Coreshack';
      const itTeam = 'IT Team';
      // If IT Team is selected, match all non-Coreshack teams
      const hasIT = filters.groups.includes(itTeam);
      if (hasIT) {
        if (ticket.group === coreshack && !filters.groups.includes(coreshack)) {
          return false;
        }
        if (ticket.group !== coreshack && !filters.groups.includes(ticket.group) && !hasIT) {
          return false;
        }
        // If IT Team is selected, include all non-Coreshack teams
        if (ticket.group !== coreshack) {
          return true;
        }
        // If Coreshack is also selected, include it
        return filters.groups.includes(coreshack);
      } else {
        // No IT Team selected, use normal logic
        if (!filters.groups.includes(ticket.group)) {
          return false;
        }
      }
    }
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(ticket.category)) {
      return false;
    }
    // Agent filter
    if (filters.agents.length > 0 && !filters.agents.includes(ticket.agentName)) {
      return false;
    }
    // Source filter
    if (filters.sources.length > 0 && !filters.sources.includes(ticket.source)) {
      return false;
    }
    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(ticket.priority)) {
      return false;
    }
    return true;
  });
}

/**
 * Get unique values for a field to populate filter dropdowns
 */
export function getUniqueValues(tickets: Ticket[], field: keyof Ticket): string[] {
  const uniqueValues = new Set<string>();
  
  tickets.forEach(ticket => {
    const value = ticket[field] as string;
    if (value) uniqueValues.add(value);
  });
  
  return Array.from(uniqueValues).sort();
}

/**
 * Format number with commas for thousands
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
} 