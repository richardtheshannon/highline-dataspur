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

export const performanceTrendDoc: DocSection = {
  id: 'performance-trend',
  title: 'Performance Trend',
  description: 'Advanced stacked area chart visualizing Google AdWords cost and conversion relationship over time',
  goal: 'Analyze the correlation between advertising spend and conversion performance to optimize cost efficiency, identify high-ROI periods, and make data-driven budget allocation decisions.',
  logic: 'Interactive stacked area chart displays two key metrics simultaneously: cost (orange gradient area) represents daily advertising spend, while conversions (green gradient area) shows daily conversion volume. The stacked visualization allows for immediate visual assessment of cost-effectiveness - when green area is proportionally larger than orange, it indicates efficient spending periods.',
  dataSource: 'Real-time Google AdWords API integration via authenticated connection. Data aggregated from all active campaigns in your account, fetched from /api/apis/google-adwords/metrics endpoint with automatic refresh based on time range selection.',
  calculations: [
    'Daily Cost: Sum of all campaign spending across ad groups, keywords, and ad formats per calendar day',
    'Daily Conversions: Total conversion actions tracked (purchases, leads, sign-ups) per calendar day',
    'Cost-Per-Conversion (CPA): Calculated as Daily Cost ÷ Daily Conversions for efficiency analysis',
    'Time Aggregation: Data points represent complete 24-hour periods in your account timezone',
    'Stacked Display: Conversion values stack on top of cost values to show combined performance volume',
    'Percentage Efficiency: Green area percentage vs. total area indicates conversion efficiency',
    'Moving Averages: Trend lines smooth out daily fluctuations for pattern recognition'
  ],
  filters: [
    'Dual Metric View: Simultaneously displays Cost ($USD) and Conversions (count) without toggling',
    'Time Range: Configurable 7-day, 30-day, 90-day, or 1-year historical windows',
    'Interactive Tooltips: Hover reveals exact cost and conversion values with formatted currency',
    'Color Legend: Orange = Cost, Green = Conversions with visual indicators',
    'Responsive Scaling: Y-axis automatically adjusts to accommodate both metric ranges',
    'Data Density: Chart intelligently spaces data points based on selected time range'
  ],
  examples: [
    'Efficient Campaign Day: $200 cost (orange) + 25 conversions (green) = $8 CPA - good performance',
    'Inefficient Spending: $500 cost + 5 conversions = $100 CPA - needs optimization',
    'High Volume Success: $1,000 cost + 150 conversions = $6.67 CPA - scale this performance',
    'Weekend Pattern (B2B): Lower orange and green areas indicate reduced activity',
    'Holiday Spike (Retail): Larger areas during peak shopping periods',
    'Budget Exhaustion: Orange area drops to zero while potential conversions remain',
    'Campaign Launch: Gradual increase in both areas as campaigns gain traction',
    'Seasonal Trends: Q4 retail campaigns show 200-300% area increases',
    'Optimization Success: Orange area decreases while green area maintains or increases'
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

export const dataFreshnessDoc: DocSection = {
  id: 'data-freshness',
  title: 'Data Freshness',
  description: 'Real-time indicator showing how current your Google Ads data is and when it was last synced',
  goal: 'Provide transparency about data currency and enable manual refresh when needed to ensure decision-making is based on the most recent information.',
  logic: 'Cache-first architecture fetches data from local database for speed. System tracks last sync timestamp and calculates age. Manual refresh triggers live API call to update cached data.',
  dataSource: 'Hybrid: Cached data from PostgreSQL (default) with fallback to live Google Ads API. Metadata tracks sync timestamps and cache age.',
  calculations: [
    'Cache Age: Current time - last sync timestamp (in minutes/hours)',
    'Freshness Status: Fresh (<1hr), Recent (1-3hrs), Stale (>3hrs)',
    'Time Ago Display: Human-readable format (e.g., "15m ago", "2h ago")',
    'Data Source Label: "Cached" for database, "Live API" for direct fetch'
  ],
  filters: [
    'Refresh Button: Forces live API sync and cache update',
    'Auto-refresh: Can be triggered by time range changes',
    'Status Indicator: Color-coded dot (Green=Fresh, Yellow=Recent, Red=Stale)'
  ],
  examples: [
    'Green "Fresh data" + "15m ago" = Recently synced, highly current',
    'Yellow "Recent data" + "2h ago" = Somewhat current, acceptable for most use',
    'Red "Stale data" + "5h ago" = Consider refreshing for latest metrics',
    'Blue "Live data" = Direct from API, real-time (fallback mode)'
  ]
}

export const accountPerformanceDoc: DocSection = {
  id: 'account-performance',
  title: 'Account Performance',
  description: 'Comprehensive performance scoring system combining CTR, conversion rate, CPA, and budget pacing into a single 0-100 score',
  goal: 'Provide at-a-glance account health assessment with detailed breakdown of contributing factors to quickly identify strengths and optimization opportunities.',
  logic: 'Multi-factor scoring algorithm evaluates 4 key areas (CTR, CVR, CPA efficiency, budget pacing) weighted equally. Each factor contributes 0-25 points, totaled for overall score out of 100. Monthly budget for pacing is auto-calculated from campaign budgets.',
  dataSource: 'Aggregated metrics from all active campaigns via Google Ads API. Monthly budget auto-calculated from campaign daily budgets (× 30.44). Compared against industry benchmarks (2% CTR, 2% CVR) and user-defined targets.',
  calculations: [
    'Performance Score: Sum of 4 weighted factors × 4 (to scale 0-100)',
    'CTR Score: (Actual CTR / 5%) × 25 points (capped at 25)',
    'CVR Score: (Actual CVR / 5%) × 25 points (capped at 25)',
    'CPA Score: (Target CPA / Actual CPA) × 25 points (capped at 25)',
    'Pacing Score: 25 - (|Budget % Spent - Time % Elapsed| × 2)',
    'Budget for Pacing: Sum of (enabled campaign daily budgets × 30.44)',
    'Status Labels: Excellent (75+), Good (60-74), Fair (40-59), Needs Attention (<40)'
  ],
  filters: [
    'Performance Indicators: Three key metrics with benchmark comparison',
    'Click Rate: Green if ≥2%, Yellow if below target',
    'Conv. Rate: Green if ≥2%, Yellow if below target',
    'CPA vs Target: Green if below target, Red if above target'
  ],
  examples: [
    'Score 85 + "Excellent" = All metrics exceeding benchmarks, optimal performance',
    'Score 65 + "Good" = Solid performance with minor optimization opportunities',
    'Score 45 + "Fair" = Mixed results, prioritize underperforming areas',
    'Score 30 + "Needs Attention" = Multiple metrics below target, immediate action required'
  ]
}

export const budgetPacingDoc: DocSection = {
  id: 'budget-pacing',
  title: 'Budget Pacing',
  description: 'Automated monthly budget tracking with spend projection system and overspending/underspending alerts based on Google Ads campaign budgets',
  goal: 'Ensure advertising spend stays on track with monthly budget by comparing time elapsed vs. budget spent, with early warnings for pacing issues. Monthly budget is automatically calculated from your active campaign budgets in Google Ads.',
  logic: 'Monthly budget is auto-calculated by summing all enabled campaign daily budgets × 30.44 (average days per month). System calculates percentage of month elapsed and percentage of budget spent, comparing these values to determine pacing status. Projects end-of-month spend based on current daily average.',
  dataSource: 'Campaign budgets and cost data from Google Ads API. Monthly budget auto-calculated from campaign daily budgets (daily budget × 30.44 for each enabled campaign). Updates automatically when campaign budgets change in Google Ads.',
  calculations: [
    'Monthly Budget: Sum of (Each enabled campaign daily budget × 30.44 days)',
    'Why 30.44: Average days per month = 365.25 ÷ 12 = 30.4375 (rounded to 30.44)',
    'Time Elapsed %: (Current day of month / Total days in month) × 100',
    'Budget Spent %: (Total Cost / Monthly Budget) × 100',
    'Projected Spend: (Total Cost / Days Elapsed) × Total Days in Month',
    'Remaining Budget: Monthly Budget - Total Cost',
    'Pacing Status: On-track (±10%), Overspending (>10% ahead), Underspending (>10% behind)'
  ],
  filters: [
    'Monthly View: Automatically resets on first of each month',
    'Status Badge: Color-coded (Green=On-track, Red=Over, Yellow=Under)',
    'Visual Progress: Dual progress bars for time and budget comparison',
    'Auto-Update: Budget updates when campaign budgets change in Google Ads',
    'Info Tooltip: Hover over "Monthly Budget" label to see calculation method'
  ],
  examples: [
    'Campaign A: $100/day, Campaign B: $50/day → Monthly Budget = ($100 + $50) × 30.44 = $4,566',
    'Day 15 of 30 (50% elapsed), $2,600 of $4,566 spent (57%) = "On Track" (within 10%)',
    'Day 10 of 30 (33% elapsed), $2,500 of $5,000 spent (50%) = "Overspending" (17% ahead)',
    'Day 20 of 30 (67% elapsed), $2,000 of $5,000 spent (40%) = "Underspending" (27% behind)',
    'Projected spend $5,200 with $5,000 budget = Warning, need to reduce daily spend',
    'No active campaigns with budgets = Empty state with explanation message'
  ]
}

export const smartInsightsDoc: DocSection = {
  id: 'smart-insights',
  title: 'Smart Insights',
  description: 'AI-powered campaign analysis engine generating actionable recommendations based on performance patterns',
  goal: 'Automatically identify optimization opportunities, spending inefficiencies, and performance trends without manual analysis, prioritized by impact.',
  logic: 'Insights engine analyzes 8 insight types across 4 categories (performance, spending, conversion, efficiency). Each insight assigned priority score (1-10) and type (success, warning, danger, info).',
  dataSource: 'Real-time campaign metrics from Google Ads API processed through adsInsightsEngine.ts algorithm.',
  calculations: [
    'Insight Types: High performers, budget pacing, low CTR alerts, conversion issues, cost spikes, efficiency wins, budget exhaustion, performance drops',
    'Priority Score: 1-10 based on impact magnitude and urgency',
    'Category Classification: Performance, Spending, Conversion, Efficiency',
    'Type Severity: Success (green), Warning (yellow), Danger (red), Info (blue)',
    'Auto-sorting: Highest priority and most severe insights appear first'
  ],
  filters: [
    'Insight Categories: All insights mixed, grouped by priority',
    'Empty State: Shows when insufficient data or all campaigns performing normally',
    'Clickable: Each insight can trigger detailed view (if configured)'
  ],
  examples: [
    'Success: "Campaign X is your top performer with 8.5% CVR - Consider increasing budget"',
    'Danger: "Campaign Y has CPA $120 vs target $50 - Urgent optimization needed"',
    'Warning: "You\'re projected to exceed monthly budget by 15% - Reduce daily spend"',
    'Info: "Weekend performance is 30% lower - Consider adjusting ad scheduling"'
  ]
}

export const campaignRankingsDoc: DocSection = {
  id: 'campaign-rankings',
  title: 'Campaign Performance Rankings',
  description: 'Comparative leaderboard ranking all campaigns across key performance metrics with color-coded performance tiers',
  goal: 'Enable quick identification of best and worst performing campaigns with multi-metric comparison to guide budget allocation and optimization priorities.',
  logic: 'Ranks campaigns 1-N for each metric independently. Top 25% get green badges, 25-50% blue, 50-75% orange, bottom 25% red. Overall rank calculated by averaging metric ranks.',
  dataSource: 'Campaign-level metrics from Google Ads API via rankCampaigns() function in adsInsightsEngine.ts.',
  calculations: [
    'Overall Rank: Average of all individual metric ranks',
    'CTR Rank: Sorted by click-through rate (highest = #1)',
    'CVR Rank: Sorted by conversion rate (highest = #1)',
    'CPA Rank: Sorted by cost per acquisition (lowest = #1)',
    'Cost Rank: Sorted by total spend (context-dependent)',
    'Conversions Rank: Sorted by total conversions (highest = #1)',
    'Percentile Colors: Top 25% green, 26-50% blue, 51-75% orange, 76-100% red'
  ],
  filters: [
    'Sortable Columns: Click any metric column to re-sort',
    'Color Indicators: Badge colors show performance tier at a glance',
    'Campaign Status: Only active campaigns included in rankings'
  ],
  examples: [
    'Campaign A: Overall #1, CTR #1 (green), CVR #2 (green), CPA #1 (green) = Top performer',
    'Campaign B: Overall #5, CTR #8 (orange), CVR #3 (green), CPA #12 (red) = Mixed performance',
    'Campaign C: Overall #15, all metrics red badges = Candidate for pause/optimization',
    'Use rankings to reallocate budget from #15 to #1-3 campaigns'
  ]
}

export const multiMetricTrendDoc: DocSection = {
  id: 'multi-metric-trend',
  title: 'Multi-Metric Trend Analysis',
  description: 'Interactive multi-line chart displaying impressions, clicks, conversions, and cost trends with correlation analysis',
  goal: 'Identify relationships between metrics over time, spot anomalies, and understand how changes in one metric affect others through correlation insights.',
  logic: 'Plots 4 metrics on dual-axis line chart (volume metrics on left, cost on right). Calculates Pearson correlation coefficients between metric pairs to reveal relationships.',
  dataSource: 'Daily performance data from Google Ads API aggregated across all active campaigns.',
  calculations: [
    'Daily Values: Each data point represents 24-hour aggregated metrics',
    'Correlation Coefficient: Pearson correlation between -1 and +1',
    'Strong Positive: +0.7 to +1.0 (metrics move together)',
    'Moderate: +0.3 to +0.7 or -0.3 to -0.7',
    'Weak/None: -0.3 to +0.3 (no clear relationship)',
    'Strong Negative: -1.0 to -0.7 (metrics move opposite)',
    'Key Correlations: Clicks↔Impressions, Conversions↔Cost, Clicks↔Conversions'
  ],
  filters: [
    'Metric Toggle: Click legend items to show/hide specific metrics',
    'Dual Y-Axis: Left axis for counts, right axis for currency',
    'Hover Details: Tooltip shows exact values for all metrics at that date',
    'Date Range: Adapts to selected time range (7d, 30d, 90d, 1y)'
  ],
  examples: [
    'Clicks-Impressions correlation +0.95 = Consistent CTR, healthy ad delivery',
    'Conversions-Cost correlation +0.85 = Spending more yields more conversions (good efficiency)',
    'Clicks-Conversions correlation +0.45 = Moderate, some CVR fluctuation',
    'Cost spike without conversion spike = Investigate inefficient spending period'
  ]
}

export const performanceHeatmapDoc: DocSection = {
  id: 'performance-heatmap',
  title: 'Day-of-Week Performance Heatmap',
  description: 'Visual heatmap showing average performance metrics by day of week to identify weekly patterns and optimize ad scheduling',
  goal: 'Reveal which days yield best results for each metric, enabling data-driven ad scheduling and budget allocation by day of week.',
  logic: 'Aggregates all historical data by day of week (Sunday-Saturday). Calculates daily averages for each metric. Color intensity reflects performance magnitude relative to min/max.',
  dataSource: 'Historical daily performance data from Google Ads API, aggregated by day of week over entire data range.',
  calculations: [
    'Day Aggregation: All Mondays averaged, all Tuesdays averaged, etc.',
    'Average Conversions: Sum of conversions on that day / count of occurrences',
    'Average Clicks: Sum of clicks / count of occurrences',
    'Average Cost: Sum of cost / count of occurrences',
    'Average CTR: (Total clicks / Total impressions) × 100 for that day',
    'Color Scale: Min value = lightest color, max value = darkest color',
    'Intensity: Darker = higher performance for that metric'
  ],
  filters: [
    'Metric Selector: Toggle between Conversions, Clicks, Cost, CTR views',
    'Color Gradient: Dynamic scale adjusts to data range',
    'Hover Details: Shows exact average values and sample size',
    'Pattern Recognition: Easily spot weekday vs weekend differences'
  ],
  examples: [
    'Conversions: Monday-Friday dark green, Saturday-Sunday light = B2B pattern, reduce weekend spend',
    'Cost: Saturday-Sunday darkest = Higher competition weekends, adjust bids',
    'CTR: Wednesday darkest = Mid-week engagement peak, increase Wednesday budgets',
    'Uniform colors across all days = No weekly pattern, scheduling less critical'
  ]
}

export const conversionFunnelDoc: DocSection = {
  id: 'conversion-funnel',
  title: 'Conversion Funnel Analysis',
  description: 'Visual funnel showing user journey from ad impression through click to conversion with drop-off analysis and bottleneck identification',
  goal: 'Pinpoint exact stage where potential customers are lost, quantify drop-off rates, and identify whether CTR or CVR is the primary optimization opportunity.',
  logic: 'Three-stage funnel (Impressions → Clicks → Conversions) with width proportional to volume. Calculates drop-off at each stage and assigns efficiency score based on overall conversion rate.',
  dataSource: 'Aggregated totals from Google Ads API across all active campaigns for selected time range.',
  calculations: [
    'CTR (Click-Through Rate): (Total Clicks / Total Impressions) × 100',
    'CVR (Conversion Rate): (Total Conversions / Total Clicks) × 100',
    'Overall CVR: (Total Conversions / Total Impressions) × 100',
    'Impression→Click Drop-off: Total Impressions - Total Clicks',
    'Click→Conversion Drop-off: Total Clicks - Total Conversions',
    'Funnel Efficiency: Overall CVR × 20 (scaled to 0-100)',
    'Status: Excellent (75+), Good (50-74), Fair (25-49), Needs Work (<25)',
    'Bottleneck: Stage with worst performance (CTR <2% or CVR <2%)'
  ],
  filters: [
    'Efficiency Badge: Color-coded score in header',
    'Visual Width: Funnel stage widths proportional to volume',
    'Bottleneck Alert: Red highlight on weakest stage',
    'Actionable Recommendations: Suggested next steps based on bottleneck'
  ],
  examples: [
    '100K impressions → 3K clicks (3% CTR) → 150 conversions (5% CVR) = Good efficiency (75/100), no major bottleneck',
    '100K impressions → 800 clicks (0.8% CTR) → 40 conversions (5% CVR) = Poor CTR bottleneck, improve ad copy/targeting',
    '100K impressions → 3K clicks (3% CTR) → 30 conversions (1% CVR) = Poor CVR bottleneck, improve landing page/offer',
    '100K impressions → 500 clicks → 5 conversions = Both stages need work, start with CTR first'
  ]
}

export const goalTrackerDoc: DocSection = {
  id: 'goal-tracker',
  title: 'Campaign Goals & Progress Tracking',
  description: 'Goal-setting interface and real-time progress tracking for each campaign with visual indicators showing performance vs. targets',
  goal: 'Enable users to set specific targets (CPA, CTR, CVR, conversion goals, monthly budget) per campaign and monitor actual performance against those benchmarks.',
  logic: 'Stores goals in database per campaign. Compares actual metrics from API against stored targets. Calculates progress percentages and displays status indicators (on-track, exceeding, missing).',
  dataSource: 'Goals from PostgreSQL GoogleAdsCampaignGoal table. Actual metrics from Google Ads API. Joined by campaign ID.',
  calculations: [
    'CPA Progress: (Actual CPA / Target CPA) × 100 (lower is better, <100% = success)',
    'CTR Progress: (Actual CTR / Target CTR) × 100 (higher is better, >100% = success)',
    'CVR Progress: (Actual CVR / Target CVR) × 100 (higher is better, >100% = success)',
    'Conversion Goal: (Actual Conversions / Target Conversions) × 100',
    'Budget Progress: (Actual Spend / Monthly Budget) × 100',
    'Status Colors: Green (meeting/exceeding), Yellow (close), Red (missing)',
    'Delta Calculation: Actual - Target for each metric'
  ],
  filters: [
    'Per-Campaign View: Each campaign shows its own goals independently',
    'Edit Mode: Click pencil icon to set/update goals',
    'Save/Cancel: Changes saved to database immediately',
    'Empty State: Shows setup prompts for campaigns without goals'
  ],
  examples: [
    'Target CPA $50, Actual $42 = Green, "16% under target" = Exceeding goal',
    'Target CTR 3%, Actual 2.1% = Yellow/Red, "0.9% below target" = Needs improvement',
    'Target 100 conversions, Actual 85 = Yellow, "85% progress" = Close to goal',
    'No goals set = Empty state with "Set Goals" button',
    'Use to identify campaigns exceeding all goals (increase budget) vs. missing (optimize/pause)'
  ]
}

export const exportReportingDoc: DocSection = {
  id: 'export-reporting',
  title: 'Data Export & Reporting',
  description: 'Comprehensive export system for downloading campaign data and generating professional reports in CSV or PDF format',
  goal: 'Enable data portability for external analysis, client reporting, and record-keeping with flexible date ranges and customizable export options.',
  logic: 'CSV export queries database and formats as spreadsheet. PDF export uses client-side jsPDF library to generate formatted report with charts and tables. Both support custom date ranges.',
  dataSource: 'Campaign data from PostgreSQL database via /api/apis/google-adwords/export endpoint. Optional goal data included if requested.',
  calculations: [
    'Date Range: Uses selected time range (7d, 30d, 90d, 1y) or custom start/end dates',
    'CSV Fields: Campaign name, status, metrics (impressions, clicks, conversions, cost, CTR, CVR, CPA)',
    'PDF Sections: Executive summary, performance score, budget pacing, campaign table, key insights',
    'File Naming: google-ads-export-YYYY-MM-DD.csv or google-ads-report-YYYY-MM-DD.pdf',
    'Goal Inclusion: Optional checkbox adds target columns to CSV and goal section to PDF'
  ],
  filters: [
    'Export Format: Toggle between CSV (spreadsheet) or PDF (visual report)',
    'Date Range Picker: Select custom start and end dates or use presets',
    'Include Goals: Checkbox to add goal data to export',
    'Time Range Fallback: Uses page time range if custom dates not set'
  ],
  examples: [
    'CSV with goals, 30 days = Spreadsheet with 10+ columns including targets, downloadable for Excel analysis',
    'PDF report, 7 days = Client-ready document with summary, charts, and recommendations',
    'Custom range 2024-01-01 to 2024-03-31 = Q1 performance report',
    'CSV without goals = Clean data export for third-party analytics tools',
    'Use PDF for executive presentations, CSV for deeper data analysis'
  ]
}