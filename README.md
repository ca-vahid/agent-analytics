# Ticket Analytics Dashboard

A comprehensive dashboard for analyzing ticket data with advanced visualization and filtering capabilities.

## Features

### Dashboard Overview
- **Multi-level Data Visualization**: View ticket data by team, agent, priority, and status
- **Date Range Filtering**: Filter all charts and stats by custom date ranges
- **Dark/Light Mode Support**: Toggle between dark and light mode for comfortable viewing
- **Responsive Design**: Works on both desktop and mobile devices

### Advanced Charts
- **Tickets by Period**: View ticket volume over time with the following capabilities:
  - Toggle between weekly and monthly views
  - Select date ranges directly on the chart by clicking and dragging
  - Download chart data as CSV

- **Team Distribution**: Analyze team performance over time with the following features:
  - Toggle between weekly and monthly views
  - Highlight specific teams by clicking on the legend
  - Hide/show teams to focus on relevant data
  - Select date ranges directly on the chart by clicking and dragging
  - Download chart data as CSV

- **Status, Priority and Category Distribution**: View ticket distribution across different dimensions
  - Interactive pie charts with hover details

### Data Filtering
- Filter by:
  - Date range
  - Team
  - Agent
  - Status
  - Priority
  - Category

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technologies Used

- **Next.js 14** with App Router
- **React** for UI components
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **date-fns** for date manipulation
- **TypeScript** for type safety