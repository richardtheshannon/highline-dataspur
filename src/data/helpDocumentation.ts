import { DocSection } from '@/contexts/HelpDocumentationContext'

export const projectStatisticsDoc: DocSection = {
  id: 'project-statistics',
  title: 'Project Statistics',
  description: 'Overview of all projects with counts by status',
  goal: 'Provide a quick visual summary of project distribution across different statuses to help users understand their workload and project pipeline at a glance.',
  logic: 'Statistics are calculated in real-time by filtering projects from the database by their status field. Each status count is calculated by counting projects where status matches the specific value (ACTIVE, COMPLETED, PLANNING, ON_HOLD).',
  dataSource: 'Project data from PostgreSQL database via Prisma ORM. Projects are fetched with their current status, priority, and other metadata.',
  calculations: [
    'Total Projects: Count of all projects regardless of status',
    'Active: Count of projects with status = "ACTIVE" or mapped to "active"',
    'Completed: Count of projects with status = "COMPLETED" or mapped to "completed"', 
    'Planning: Count of projects with status = "PLANNING" or mapped to "planning"',
    'On Hold: Count of projects with status = "ON_HOLD" or mapped to "on_hold"'
  ],
  examples: [
    'If you have 15 total projects: 5 active, 3 completed, 4 planning, 3 on hold',
    'Color coding: Blue for active, Green for completed, Gray for planning, Yellow for on hold'
  ]
}

export const filterSearchDoc: DocSection = {
  id: 'filter-search',
  title: 'Filter & Search',
  description: 'Tools to filter and search through your projects',
  goal: 'Enable users to quickly find specific projects by applying multiple filters and search criteria simultaneously.',
  logic: 'Filters work by applying JavaScript array filtering on the client side after data is loaded. Search uses case-insensitive string matching on project names and descriptions. Multiple filters are combined using AND logic.',
  dataSource: 'All loaded project data is filtered client-side for immediate responsiveness.',
  filters: [
    'Status Filter: All Status, Planning, Active, On Hold, Completed',
    'Priority Filter: All Priority, Low, Medium, High, Critical', 
    'Type Filter: All Types, Development, Design, Marketing, Research, Consulting, Web Development, Mobile App',
    'Search: Text search across project names and descriptions'
  ],
  examples: [
    'Search "mobile" + Priority "High" = Only high priority projects containing "mobile"',
    'Status "Active" + Type "Development" = Only active development projects'
  ]
}

export const projectsTableDoc: DocSection = {
  id: 'projects-table',
  title: 'All Projects',
  description: 'Comprehensive table view of all projects with sortable columns',
  goal: 'Provide a detailed, sortable, and actionable view of all projects with key information and management actions.',
  logic: 'Projects are displayed in a responsive table with sortable columns. Sorting is performed client-side with ascending/descending toggle. Progress is calculated based on status mapping, and actions provide direct navigation to project details.',
  dataSource: 'Project data fetched from API endpoints that query the PostgreSQL database through Prisma ORM.',
  sortOptions: [
    'Project Name: Alphabetical sorting (A-Z or Z-A)',
    'Status: Sorts by status priority order', 
    'Priority: Sorts by priority level (Low to Critical)',
    'Start Date: Chronological sorting (Newest first or Oldest first)',
    'Progress: Numerical sorting (0% to 100%)'
  ],
  calculations: [
    'Progress %: Calculated from status - Planning: 10%, In Progress: 50%, On Hold: 30%, Completed: 100%, Cancelled: 0%',
    'Team display: Shows up to 3 team member initials, with +N indicator for additional members'
  ],
  examples: [
    'Click column headers to sort (arrow indicates direction)',
    'View: Opens project details page',
    'Edit: Opens project editing form',
    'Delete: Removes project after confirmation'
  ]
}

export const keyMetricsDoc: DocSection = {
  id: 'key-metrics',
  title: 'Key Metrics',
  description: 'Essential Google AdWords performance indicators',
  goal: 'Display the most important advertising metrics with period-over-period comparison to track campaign performance trends.',
  logic: 'Metrics are fetched from Google AdWords API and aggregated across all active campaigns. Comparison data shows percentage change from the previous period of the same length.',
  dataSource: 'Google AdWords API via authenticated API integration. Data is refreshed based on selected time range.',
  calculations: [
    'Impressions: Total number of times ads were shown',
    'Clicks: Total clicks received across all campaigns',
    'CTR (Click-Through Rate): (Clicks / Impressions) × 100',
    'Conversions: Total conversion actions tracked',
    'CVR (Conversion Rate): (Conversions / Clicks) × 100',
    'Cost: Total spend in USD across all campaigns',
    'CPC (Cost Per Click): Total Cost / Total Clicks',
    'CPA (Cost Per Acquisition): Total Cost / Total Conversions'
  ],
  filters: [
    'Time Range: 7 days, 30 days, 90 days, 1 year',
    'All metrics update when time range changes'
  ],
  examples: [
    'Green +15% indicates 15% improvement over previous period',
    'Red -8% indicates 8% decrease compared to previous period',
    'CTR of 3.2% means 3.2 clicks per 100 impressions'
  ]
}

export const connectionStatusDoc: DocSection = {
  id: 'connection-status',
  title: 'Connection Status',
  description: 'Shows the current status of Google AdWords API integration',
  goal: 'Provide clear visibility into API connection health and quick access to configuration when issues arise.',
  logic: 'Status is determined by testing the API connection with stored credentials. Green = successful authentication, Red = authentication failed, Gray = not configured.',
  dataSource: 'Real-time API connection test using stored Google AdWords credentials from the database.',
  calculations: [
    'Connected: API credentials valid and responding',
    'Error: API credentials invalid or connection failed',
    'Disconnected: No credentials configured or connection not established'
  ],
  examples: [
    'Green "Connected" with checkmark = API is working properly',
    'Red "Error" with error icon = Check credentials in API configuration',
    'Gray "Disconnected" = Click "Configure" to set up API connection'
  ]
}

export const platformPerformanceDoc: DocSection = {
  id: 'platform-performance',
  title: 'Platform Performance Analytics',
  description: 'Monthly engagement metrics across advertising platforms',
  goal: 'Visualize performance trends and compare effectiveness across different advertising platforms to optimize marketing spend and strategy.',
  logic: 'Line chart displays monthly engagement data for each platform. Data points show progression over time, with different colored lines representing each platform (Google AdWords, Facebook, Instagram, TikTok).',
  dataSource: 'Mock data representing monthly engagement metrics. In production, this would connect to respective platform APIs (Google Ads API, Facebook Marketing API, Instagram Graph API, TikTok for Business API).',
  calculations: [
    'Monthly Engagement: Total interactions (clicks, impressions, conversions) per month',
    'Y-Axis: Scaled to show values in thousands (K format)',
    'Trend Analysis: Line progression shows growth or decline patterns',
    'Platform Comparison: Multiple lines allow side-by-side performance comparison'
  ],
  filters: [
    'Time Range: Currently shows full year (Jan-Dec)',
    'Platform Toggle: Each line can be clicked in legend to show/hide',
    'Hover Details: Tooltip shows exact values for each month'
  ],
  examples: [
    'TikTok (green line) shows strongest growth ending at 5.5K in December',
    'Facebook (blue line) maintained steady 4K-5K range throughout year',
    'Google AdWords (orange line) recovered from mid-year dip to 4.8K',
    'Instagram (pink line) shows consistent performance around 2K-4K range'
  ]
}

export const dailyManifestDoc: DocSection = {
  id: 'daily-manifest',
  title: 'Daily Manifest',
  description: 'Today\'s scheduled timeline events and milestones',
  goal: 'Provide a comprehensive overview of all events, tasks, and milestones scheduled for today to help users prioritize and manage their daily workflow.',
  logic: 'Fetches timeline events from the database where the date matches today. Events are sorted chronologically and displayed with time, type icons, project context, and priority indicators.',
  dataSource: 'Timeline events from PostgreSQL database via /api/timeline/today endpoint. Links to project details and shows real-time status updates.',
  calculations: [
    'Today\'s Events: Filters timeline events where date = current date',
    'Time Display: Formats event times to 12-hour format (e.g., "2:30 PM")',
    'Event Count: Shows total number of events scheduled for today',
    'Priority Colors: Maps project priority to color codes (Urgent=Red, High=Orange, Medium=Blue, Low=Green)'
  ],
  filters: [
    'Date Filter: Automatically shows only today\'s events',
    'Event Types: Milestones, Tasks, Meetings, Deadlines, Releases',
    'Project Priority: Events show associated project priority levels',
    'Status: Displays current project status for context'
  ],
  examples: [
    'Morning meeting at 9:00 AM for Project Alpha (High priority)',
    'Milestone deadline at 3:00 PM for Website Redesign (Urgent priority)',
    'Task completion by 5:00 PM for Marketing Campaign (Medium priority)',
    'Empty state: "No events scheduled for today - Your schedule is clear!"'
  ]
}

export const tomorrowMilestonesDoc: DocSection = {
  id: 'tomorrow-milestones',
  title: 'Tomorrow\'s Milestones',
  description: 'Upcoming milestones, deadlines, and releases scheduled for tomorrow',
  goal: 'Give users advance visibility into critical milestones and deadlines coming up tomorrow, enabling better preparation and resource allocation.',
  logic: 'Fetches tomorrow\'s timeline events and filters specifically for milestone-type events (milestones, deadlines, releases). Excludes regular tasks and meetings to focus on critical deliverables.',
  dataSource: 'Timeline events from PostgreSQL database via /api/timeline/tomorrow endpoint. Filtered client-side to show only milestone, deadline, and release event types.',
  calculations: [
    'Tomorrow\'s Date: Calculates tomorrow by adding 1 day to current date',
    'Milestone Filtering: Includes only "milestone", "deadline", and "release" event types',
    'Time Display: Shows scheduled time in 12-hour format',
    'Project Status: Maps project status to color-coded badges (In Progress=Blue, Planning=Green, On Hold=Yellow)'
  ],
  filters: [
    'Date Filter: Shows only tomorrow\'s events',
    'Event Type Filter: Only milestones, deadlines, and releases',
    'Collapsible: Can be collapsed to save space',
    'Clickable: Each milestone links to project details page'
  ],
  examples: [
    'Product Release v2.1 at 10:00 AM (Purple flag icon)',
    'Project Deadline at 2:00 PM (Yellow schedule icon)',
    'Major Milestone completion at 4:00 PM (Red flag icon)',
    'Empty state: "No milestones tomorrow - Clear schedule ahead"'
  ]
}

export const overdueEventsDoc: DocSection = {
  id: 'overdue-events',
  title: 'Overdue Events',
  description: 'Timeline events and milestones that have passed their due dates',
  goal: 'Highlight overdue items requiring immediate attention, with urgency indicators based on how long they\'ve been overdue and their project priority.',
  logic: 'Fetches events from /api/timeline/overdue endpoint. Events are categorized by overdue intensity (recent, medium, high, critical) and styled with increasingly urgent visual indicators.',
  dataSource: 'Overdue timeline events from PostgreSQL database. Includes calculated fields for days overdue, hours overdue, and formatted overdue text.',
  calculations: [
    'Days Overdue: Current date - original due date',
    'Overdue Text: Human-readable format ("2 days ago", "1 week ago")',
    'Urgency Level: Recent (1 day), Medium (2-3 days), High (4-7 days), Critical (7+ days)',
    'Priority Color: Combines project priority with overdue duration for color intensity',
    'Display Limit: Shows first 3 events by default, with "Show More" option'
  ],
  filters: [
    'Overdue Duration: All events past their due date',
    'Show More/Less: Toggle between 3 events and full list',
    'Urgency Sorting: Most urgent items appear first',
    'Collapsible: Can be collapsed to save space'
  ],
  examples: [
    'Critical: Project deadline 2 weeks overdue (Dark red, high urgency)',
    'High: Milestone 5 days overdue (Medium red)',
    'Recent: Task 1 day overdue (Standard red)',
    'Empty state: "No overdue events - You\'re all caught up!"'
  ]
}