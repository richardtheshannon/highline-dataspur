'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { keyMetricsDoc, connectionStatusDoc, performanceTrendDoc } from '@/data/helpDocumentation'

interface Campaign {
  id: string
  name: string
  status: 'enabled' | 'paused' | 'removed'
  budget: number
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  conversionRate: number
  cpc: number
  cpa: number
}

interface PerformanceData {
  date: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
}

interface ComparisonData {
  impressions?: { value: number; change: number; trend: string }
  clicks?: { value: number; change: number; trend: string }
  conversions?: { value: number; change: number; trend: string }
  cost?: { value: number; change: number; trend: string }
  cpa?: { value: number; change: number; trend: string }
}

export default function GoogleAdWordsAnalytics() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('impressions')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [comparison, setComparison] = useState<ComparisonData>({})
  const [refreshing, setRefreshing] = useState(false)
  const [dataSource, setDataSource] = useState<'cache' | 'live_api_fallback' | 'unknown'>('unknown')
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [cacheAge, setCacheAge] = useState<number>(0)

  const [totals, setTotals] = useState({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    cost: 0,
    ctr: 0,
    conversionRate: 0,
    cpc: 0,
    cpa: 0
  })

  useEffect(() => {
    if (session?.user) {
      checkConnectionStatus()
      fetchAnalyticsData()
    }
  }, [session, timeRange])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/apis/google-adwords')
      const data = await response.json()

      // Check both old and new response formats
      const status = data.status || (data.config && data.config.status)

      if (status && (status === 'ACTIVE' || status === 'active')) {
        setConnectionStatus('connected')
      } else if (status && (status === 'ERROR' || status === 'error')) {
        setConnectionStatus('error')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Error checking connection status:', error)
      setConnectionStatus('error')
    }
  }

  const fetchAnalyticsData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      if (forceRefresh) {
        setRefreshing(true)
      }

      // Fetch metrics data from the API (now cache-first with smart refresh)
      const url = `/api/apis/google-adwords/metrics?timeRange=${timeRange}${forceRefresh ? '&refresh=true' : ''}`
      const metricsResponse = await fetch(url)

      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const metricsData = await metricsResponse.json()

      // Update connection status based on API response
      if (metricsData.config?.status === 'ACTIVE') {
        setConnectionStatus('connected')
      }

      // Extract metadata about data source and freshness
      if (metricsData.meta) {
        setDataSource(metricsData.meta.dataSource || 'unknown')
        setLastSyncAt(metricsData.meta.lastSyncAt || metricsData.config?.lastSync || null)
        setCacheAge(metricsData.meta.cacheAge || 0)
      }

      // Set the real data
      setTotals(metricsData.metrics.totals)
      setCampaigns(metricsData.metrics.campaigns)
      setPerformanceData(metricsData.metrics.performanceData)
      setComparison(metricsData.metrics.comparison || {})
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchAnalyticsData(true)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(0)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return value.toFixed(2) + '%'
  }

  const formatTimeAgo = (timestamp: string | null): string => {
    if (!timestamp) return 'Unknown'

    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return then.toLocaleDateString()
  }

  const getDataFreshnessIndicator = () => {
    const ageHours = cacheAge / (1000 * 60 * 60)

    if (dataSource === 'cache' && ageHours < 1) {
      return { status: 'fresh', color: '#10b981', text: 'Fresh data' }
    } else if (dataSource === 'cache' && ageHours < 3) {
      return { status: 'good', color: '#f59e0b', text: 'Recent data' }
    } else if (dataSource === 'cache') {
      return { status: 'stale', color: '#ef4444', text: 'Stale data' }
    } else if (dataSource === 'live_api_fallback') {
      return { status: 'live', color: '#3b82f6', text: 'Live data' }
    }

    return { status: 'unknown', color: '#6b7280', text: 'Unknown' }
  }

  // Custom tooltip component for Cost & Conversions AreaChart
  const CostConversionsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
      
      return (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.75rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              color: entry.color, 
              margin: 0, 
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                width: '12px', 
                height: '12px', 
                background: entry.color, 
                borderRadius: '2px' 
              }}></span>
              {entry.dataKey === 'cost' ? 
                `Cost: ${formatCurrency(entry.value)}` : 
                `Conversions: ${formatNumber(entry.value)}`
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom tooltip component for Overall Campaign Performance AreaChart
  const OverallCampaignTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
      
      return (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.75rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{date}</p>
          <p style={{ color: 'var(--text-secondary)', margin: 0, marginTop: '0.25rem', fontSize: '0.875rem' }}>
            {enabledCampaigns.length} Active Campaigns
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              color: entry.color, 
              margin: 0, 
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                width: '12px', 
                height: '12px', 
                background: entry.color, 
                borderRadius: '2px' 
              }}></span>
              {entry.dataKey === 'cost' ? 
                `Cost: ${formatCurrency(entry.value)}` : 
                `Conversions: ${formatNumber(entry.value)}`
              }
            </p>
          ))}
          {payload.length >= 2 && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ 
                color: 'var(--text-secondary)', 
                margin: 0, 
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                CPA: {payload.find((p: any) => p.dataKey === 'cost')?.value && payload.find((p: any) => p.dataKey === 'conversions')?.value ? 
                  formatCurrency(payload.find((p: any) => p.dataKey === 'cost').value / payload.find((p: any) => p.dataKey === 'conversions').value) :
                  'N/A'
                }
              </p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Format chart data for better display
  const chartData = performanceData.slice(-30).map(data => ({
    ...data,
    displayDate: new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  // Filter only enabled campaigns for display
  const enabledCampaigns = campaigns.filter(campaign => campaign.status === 'enabled')

  // Use actual performance data from enabled campaigns
  const overallPerformanceData = chartData.map(dayData => ({
    date: dayData.date,
    displayDate: dayData.displayDate,
    impressions: dayData.impressions,
    clicks: dayData.clicks,
    conversions: dayData.conversions,
    cost: dayData.cost,
    ctr: (dayData as any).ctr || (dayData.clicks && dayData.impressions ? (dayData.clicks / dayData.impressions * 100) : 0),
    conversionRate: (dayData as any).conversionRate || (dayData.conversions && dayData.clicks ? (dayData.conversions / dayData.clicks * 100) : 0)
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-state">
          <span className="material-symbols-outlined loading-icon">hourglass_empty</span>
          <p>Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="safe-margin">
      {/* Two Column Layout like Home Dashboard */}
      <div className="grid grid-cols-3 gap-6 items-start" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'start', gap: '1.5rem' }}>
        
        {/* Left Column - Metrics Cards and Campaign List */}
        <div className="main-content-left">
          
          {/* Page Header Card */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-content" style={{ padding: '1.5rem' }}>
              <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <Link href="/dashboard/analytics" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Analytics</Link>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>chevron_right</span>
                <span>Google AdWords</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Google AdWords Analytics</h1>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Monitor your advertising performance and campaign metrics</p>
            </div>
          </div>
          
          {/* Connection Status Card */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <DocumentedTitle 
                className=""
                icon="link"
                title="Connection Status"
                documentation={connectionStatusDoc}
                as="h3"
              />
            </div>
            <div className="card-content" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ 
                    color: connectionStatus === 'connected' ? 'var(--success)' : 
                           connectionStatus === 'error' ? 'var(--error)' : 'var(--text-secondary)'
                  }}>
                    {connectionStatus === 'connected' ? 'check_circle' : 
                     connectionStatus === 'error' ? 'error' : 'radio_button_unchecked'}
                  </span>
                  <span>{connectionStatus === 'connected' ? 'Connected' :
                         connectionStatus === 'error' ? 'Error' : 'Disconnected'}</span>
                </div>
                {connectionStatus !== 'connected' && (
                  <Link 
                    href="/dashboard/apis/google-adwords" 
                    className="form-btn form-btn-sm form-btn-primary"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    Configure
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Data Freshness & Refresh Controls */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
                  schedule
                </span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Data Freshness
                </h3>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="form-btn form-btn-sm form-btn-primary"
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  opacity: refreshing ? 0.6 : 1
                }}
              >
                <span className="material-symbols-outlined" style={{
                  fontSize: '1rem',
                  animation: refreshing ? 'spin 1s linear infinite' : 'none'
                }}>
                  refresh
                </span>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="card-content" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getDataFreshnessIndicator().color
                    }}
                  ></span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {getDataFreshnessIndicator().text}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {dataSource === 'cache' ? 'Cached' : dataSource === 'live_api_fallback' ? 'Live API' : 'Unknown'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Last updated: {formatTimeAgo(lastSyncAt)}
              </div>
              {dataSource === 'cache' && cacheAge > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Cache age: {Math.round(cacheAge / (1000 * 60))} minutes
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics Card */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <DocumentedTitle 
                className=""
                icon="analytics"
                title="Key Metrics"
                documentation={keyMetricsDoc}
                as="h3"
              />
              <select 
                className="form-select"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
              >
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="1y">1 year</option>
              </select>
            </div>
            <div className="card-content">
              <div className="metric-item">
                <div className="metric-label">Impressions</div>
                <div className="metric-value">{formatNumber(totals.impressions)}</div>
                {comparison.impressions && (
                  <div className={`metric-change ${comparison.impressions.trend === 'up' ? 'positive' : 'negative'}`}>
                    {comparison.impressions.trend === 'up' ? '+' : ''}{comparison.impressions.change}%
                  </div>
                )}
              </div>
              <div className="metric-item">
                <div className="metric-label">Clicks</div>
                <div className="metric-value">{formatNumber(totals.clicks)}</div>
                <div className="metric-subtext">CTR: {formatPercentage(totals.ctr)}</div>
                {comparison.clicks && (
                  <div className={`metric-change ${comparison.clicks.trend === 'up' ? 'positive' : 'negative'}`}>
                    {comparison.clicks.trend === 'up' ? '+' : ''}{comparison.clicks.change}%
                  </div>
                )}
              </div>
              <div className="metric-item">
                <div className="metric-label">Conversions</div>
                <div className="metric-value">{formatNumber(totals.conversions)}</div>
                <div className="metric-subtext">CVR: {formatPercentage(totals.conversionRate)}</div>
                {comparison.conversions && (
                  <div className={`metric-change ${comparison.conversions.trend === 'up' ? 'positive' : 'negative'}`}>
                    {comparison.conversions.trend === 'up' ? '+' : ''}{comparison.conversions.change}%
                  </div>
                )}
              </div>
              <div className="metric-item">
                <div className="metric-label">Total Spend</div>
                <div className="metric-value">{formatCurrency(totals.cost)}</div>
                <div className="metric-subtext">CPC: {formatCurrency(totals.cpc)}</div>
                {comparison.cost && (
                  <div className={`metric-change ${comparison.cost.trend === 'up' ? 'negative' : 'positive'}`}>
                    {comparison.cost.trend === 'up' ? '+' : ''}{comparison.cost.change}%
                  </div>
                )}
              </div>
              <div className="metric-item">
                <div className="metric-label">Cost per Acquisition</div>
                <div className="metric-value">{formatCurrency(totals.cpa)}</div>
                {comparison.cpa && (
                  <div className={`metric-change ${comparison.cpa.trend === 'up' ? 'negative' : 'positive'}`}>
                    {comparison.cpa.trend === 'up' ? '+' : ''}{comparison.cpa.change}%
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Charts */}
        <div className="main-content-right">
          
          {/* Performance Trend Chart */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <DocumentedTitle 
                className=""
                icon="trending_up"
                title="Performance Trend"
                documentation={performanceTrendDoc}
                as="h3"
              />
              <div className="form-select-wrapper" style={{ fontSize: '0.875rem' }}>
                Cost & Conversions
              </div>
            </div>
            <div className="card-content">
              <div className="chart-container" style={{ height: '300px', padding: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: chartData.length > 20 ? 60 : 25 }}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      interval={chartData.length > 15 ? Math.ceil(chartData.length / 6) : 0}
                      tick={{ fill: 'var(--text-secondary)' }}
                      angle={chartData.length > 20 ? -45 : 0}
                      textAnchor={chartData.length > 20 ? 'end' : 'middle'}
                      height={chartData.length > 20 ? 60 : 30}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      tick={{ fill: 'var(--text-secondary)' }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip content={<CostConversionsTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone"
                      dataKey="cost"
                      stackId="1"
                      stroke="#FF6B35"
                      fill="url(#costGradient)"
                      strokeWidth={2}
                      name="Cost ($)"
                    />
                    <Area 
                      type="monotone"
                      dataKey="conversions"
                      stackId="1"
                      stroke="#10B981"
                      fill="url(#conversionsGradient)"
                      strokeWidth={2}
                      name="Conversions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Overall Campaign Performance Chart */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3>
                <span className="material-symbols-outlined">analytics</span>
                Overall Campaign Performance ({enabledCampaigns.length} Enabled)
              </h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {enabledCampaigns.length} of {campaigns.length} campaigns active
              </div>
            </div>
            <div className="card-content">
              <div className="chart-container" style={{ height: '350px', padding: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overallPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="overallCostGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="overallConversionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      interval={overallPerformanceData.length > 15 ? Math.ceil(overallPerformanceData.length / 8) : 0}
                      tick={{ fill: 'var(--text-secondary)' }}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      tick={{ fill: 'var(--text-secondary)' }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip content={<OverallCampaignTooltip />} />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '10px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}
                    />
                    <Area 
                      type="monotone"
                      dataKey="cost"
                      stackId="1"
                      stroke="#EF4444"
                      fill="url(#overallCostGradient)"
                      strokeWidth={2}
                      name="Cost ($)"
                    />
                    <Area 
                      type="monotone"
                      dataKey="conversions"
                      stackId="1"
                      stroke="#F59E0B"
                      fill="url(#overallConversionsGradient)"
                      strokeWidth={2}
                      name="Conversions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-insights" style={{ 
                padding: '1rem',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-secondary)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                  <div className="insight-metric">
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avg Daily Impressions</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {formatNumber(overallPerformanceData.reduce((sum, day) => sum + day.impressions, 0) / overallPerformanceData.length)}
                    </div>
                  </div>
                  <div className="insight-metric">
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avg Daily Clicks</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {formatNumber(overallPerformanceData.reduce((sum, day) => sum + day.clicks, 0) / overallPerformanceData.length)}
                    </div>
                  </div>
                  <div className="insight-metric">
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avg Daily Conversions</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {formatNumber(overallPerformanceData.reduce((sum, day) => sum + day.conversions, 0) / overallPerformanceData.length)}
                    </div>
                  </div>
                  <div className="insight-metric">
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avg Daily Cost</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {formatCurrency(overallPerformanceData.reduce((sum, day) => sum + day.cost, 0) / overallPerformanceData.length)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Campaigns Cards */}
          <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3>
                <span className="material-symbols-outlined">campaign</span>
                Top Campaigns
              </h3>
              <button
                onClick={() => fetchAnalyticsData(true)}
                className="icon-btn"
                title="Refresh"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
            <div className="card-content" style={{ padding: '1rem' }}>
              <div className="campaigns-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {enabledCampaigns.slice(0, 6).map(campaign => (
                  <div key={campaign.id} className="campaign-card">
                    <div className="campaign-card-header">
                      <div className="campaign-card-name">{campaign.name}</div>
                      <span className={`status-dot ${campaign.status}`} title={campaign.status}></span>
                    </div>
                    <div className="campaign-card-metrics">
                      <div className="campaign-card-metric">
                        <span className="metric-label">Impressions</span>
                        <span className="metric-value">{formatNumber(campaign.impressions)}</span>
                      </div>
                      <div className="campaign-card-metric">
                        <span className="metric-label">Clicks</span>
                        <span className="metric-value">{formatNumber(campaign.clicks)}</span>
                      </div>
                      <div className="campaign-card-metric">
                        <span className="metric-label">CTR</span>
                        <span className="metric-value">{formatPercentage(campaign.ctr)}</span>
                      </div>
                      <div className="campaign-card-metric">
                        <span className="metric-label">Spend</span>
                        <span className="metric-value">{formatCurrency(campaign.cost)}</span>
                      </div>
                    </div>
                    <div className="campaign-card-performance">
                      <div className="performance-bar">
                        <div 
                          className="performance-fill"
                          style={{ width: `${Math.min((campaign.cost / campaign.budget) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="performance-text">
                        {formatPercentage((campaign.cost / campaign.budget) * 100)} of budget
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={() => router.push('/dashboard/apis/google-adwords')}
                  className="view-all-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--accent)',
                    borderRadius: '6px',
                    color: 'var(--accent)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--accent)'
                  }}
                >
                  View All Campaigns
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Campaign Performance Table */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>
                <span className="material-symbols-outlined">table_chart</span>
                Campaign Performance (Enabled Only)
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="icon-btn" title="Download">
                  <span className="material-symbols-outlined">download</span>
                </button>
                <button className="icon-btn" title="Settings">
                  <span className="material-symbols-outlined">settings</span>
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>CTR</th>
                      <th>Cost</th>
                      <th>CPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enabledCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          No enabled campaigns found. Please check your Google AdWords account.
                        </td>
                      </tr>
                    ) : enabledCampaigns.map(campaign => (
                      <tr key={campaign.id}>
                        <td className="campaign-name-cell">{campaign.name}</td>
                        <td>
                          <span className={`status-badge status-${campaign.status}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td>{formatNumber(campaign.impressions)}</td>
                        <td>{formatNumber(campaign.clicks)}</td>
                        <td>{formatPercentage(campaign.ctr)}</td>
                        <td>{formatCurrency(campaign.cost)}</td>
                        <td>{formatCurrency(campaign.cpc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .dashboard-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .card-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
        }

        .card-header h3 .material-symbols-outlined {
          font-size: 1.25rem;
          color: var(--accent);
        }

        .card-content {
          padding: 0;
        }

        .metric-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .metric-item:last-child {
          border-bottom: none;
        }

        .metric-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .metric-subtext {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .metric-change {
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .metric-change.positive {
          color: var(--success);
        }

        .metric-change.negative {
          color: var(--error);
        }

        .campaign-list {
          padding: 0.5rem 0;
        }

        .campaign-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .campaign-item:last-child {
          border-bottom: none;
        }

        .campaign-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .campaign-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-secondary);
        }

        .status-dot.enabled {
          background: var(--success);
        }

        .status-dot.paused {
          background: var(--warning);
        }

        .status-dot.removed {
          background: var(--error);
        }

        .campaign-metrics {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .campaign-metric {
          display: flex;
          flex-direction: column;
        }

        .campaign-metric .metric-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .campaign-metric .metric-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .campaign-performance {
          margin-top: 0.5rem;
        }

        .performance-bar {
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }

        .performance-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.3s;
        }

        .performance-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .view-all-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: none;
          border-top: 1px solid var(--border-color);
          color: var(--accent);
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .view-all-btn:hover {
          background: var(--hover-bg);
        }

        .campaign-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .campaign-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .campaign-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .campaign-card-name {
          font-weight: 500;
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .campaign-card-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .campaign-card-metric {
          display: flex;
          flex-direction: column;
        }

        .campaign-card-metric .metric-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .campaign-card-metric .metric-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .campaign-card-performance {
          margin-top: 0.75rem;
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-btn:hover {
          color: var(--accent);
        }

        .icon-btn .material-symbols-outlined {
          font-size: 1.25rem;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .data-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.875rem;
        }

        .data-table tbody tr:hover {
          background: var(--hover-bg);
        }

        .data-table tbody tr:last-child td {
          border-bottom: none;
        }

        .campaign-name-cell {
          font-weight: 500;
          color: var(--text-primary);
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.status-enabled {
          background: var(--success-bg);
          color: var(--success);
        }

        .status-badge.status-paused {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .status-badge.status-removed {
          background: var(--error-bg);
          color: var(--error);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
        }

        .loading-icon {
          font-size: 2.5rem;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr !important;
          }
          
          .campaigns-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .campaign-metrics {
            flex-wrap: wrap;
          }

          .data-table {
            font-size: 0.75rem;
          }

          .data-table th,
          .data-table td {
            padding: 0.5rem;
          }
          
          .campaigns-grid {
            grid-template-columns: 1fr !important;
          }
          
          .campaign-card {
            padding: 0.75rem;
          }
          
          .campaign-card-name {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}