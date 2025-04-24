import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link 
        href="/"
        className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Dashboard
      </Link>
      
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">About Ticket Analytics Dashboard</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800 dark:text-gray-100">Features</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3 text-gray-800 dark:text-gray-100">Dashboard Overview</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Multi-level Data Visualization</strong>: View ticket data by team, agent, priority, and status</li>
          <li><strong>Date Range Filtering</strong>: Filter all charts and stats by custom date ranges</li>
          <li><strong>Dark/Light Mode Support</strong>: Toggle between dark and light mode for comfortable viewing</li>
          <li><strong>Responsive Design</strong>: Works on both desktop and mobile devices</li>
        </ul>
        
        <h3 className="text-xl font-medium mt-6 mb-3 text-gray-800 dark:text-gray-100">Advanced Charts</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>
            <strong>Tickets by Period</strong>: View ticket volume over time with the following capabilities:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Toggle between weekly and monthly views</li>
              <li>Select date ranges directly on the chart by clicking and dragging</li>
              <li>Download chart data as CSV</li>
            </ul>
          </li>
          <li className="mt-3">
            <strong>Team Distribution</strong>: Analyze team performance over time with the following features:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Toggle between weekly and monthly views</li>
              <li>Highlight specific teams by clicking on the legend</li>
              <li>Hide/show teams to focus on relevant data</li>
              <li>Select date ranges directly on the chart by clicking and dragging</li>
              <li>Download chart data as CSV</li>
            </ul>
          </li>
          <li className="mt-3">
            <strong>Status, Priority and Category Distribution</strong>: View ticket distribution across different dimensions
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Interactive pie charts with hover details</li>
            </ul>
          </li>
        </ul>
        
        <h3 className="text-xl font-medium mt-6 mb-3 text-gray-800 dark:text-gray-100">Data Filtering</h3>
        <p className="mb-3">Filter by:</p>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>Date range</li>
          <li>Team</li>
          <li>Agent</li>
          <li>Status</li>
          <li>Priority</li>
          <li>Category</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800 dark:text-gray-100">Technologies Used</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Next.js 14</strong> with App Router</li>
          <li><strong>React</strong> for UI components</li>
          <li><strong>Tailwind CSS</strong> for styling</li>
          <li><strong>Recharts</strong> for data visualization</li>
          <li><strong>date-fns</strong> for date manipulation</li>
          <li><strong>TypeScript</strong> for type safety</li>
        </ul>
      </div>
    </div>
  );
} 