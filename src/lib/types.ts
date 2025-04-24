export interface Ticket {
  createdDate: string;
  group: string;
  id: string;
  agentName: string;
  category: string;
  subject: string;
  source: string;
  priority: string;
  status: string;
  yearMonth?: string; // For aggregation
}

export interface TicketAggregate {
  label: string;
  count: number;
  percentage?: number;
}

export interface MonthlyTicketCount {
  yearMonth: string;
  count: number;
  group?: string;
  category?: string;
  agent?: string;
}

export interface FilterOptions {
  dateRange: [Date | null, Date | null];
  groups: string[];
  categories: string[];
  agents: string[];
  sources: string[];
  priorities: string[];
}

export interface CSVMappings {
  createdDate: string;
  group: string;
  id: string;
  agentName: string;
  category: string;
  subject: string;
  source: string;
  priority: string;
}

// Helper for chart data
export interface ChartData {
  [key: string]: number | string;
} 