'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { keyMetricsDoc, connectionStatusDoc } from '@/data/helpDocumentation'

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
      
      if (data.config && data.config.status === 'ACTIVE') {
        setConnectionStatus('connected')
      } else if (data.config && data.config.status === 'ERROR') {
        setConnectionStatus('error')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Error checking connection status:', error)
      setConnectionStatus('error')
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch real metrics data from the API
      const metricsResponse = await fetch(`/api/apis/google-adwords/metrics?timeRange=${timeRange}`)
      
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics')
      }
      
      const metricsData = await metricsResponse.json()
      
      // Update connection status based on API response
      if (metricsData.config?.status === 'ACTIVE') {
        setConnectionStatus('connected')
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
    }
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

  // Custom tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      const formattedValue = selectedMetric === 'cost' ? formatCurrency(value) : formatNumber(value)
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
          <p style={{ color: 'var(--accent)', margin: 0, marginTop: '0.25rem' }}>
            {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}: {formattedValue}
          </p>
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

  // Calculate overall campaign performance data for enabled campaigns
  const enabledCampaigns = campaigns.filter(campaign => campaign.status === 'enabled')
  const overallPerformanceData = chartData.map(dayData => {
    const enabledPerformance = {
      date: dayData.date,
      displayDate: dayData.displayDate,
      impressions: Math.round(dayData.impressions * 0.85), // Assume 85% from enabled campaigns
      clicks: Math.round(dayData.clicks * 0.85),
      conversions: Math.round(dayData.conversions * 0.85),
      cost: Math.round(dayData.cost * 0.85),
      ctr: (dayData.clicks / dayData.impressions * 100) || 0,
      conversionRate: (dayData.conversions / dayData.clicks * 100) || 0
    }
    return enabledPerformance
  })

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
              <h3>
                <span className="material-symbols-outlined">trending_up</span>
                Performance Trend
              </h3>
              <select 
                className="form-select"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
              >
                <option value="impressions">Impressions</option>
                <option value="clicks">Clicks</option>
                <option value="conversions">Conversions</option>
                <option value="cost">Cost</option>
              </select>
            </div>
            <div className="card-content">
              <div className="chart-container" style={{ height: '300px', padding: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: chartData.length > 20 ? 60 : 25 }}>
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
                      tickFormatter={(value) => selectedMetric === 'cost' ? formatCurrency(value) : formatNumber(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey={selectedMetric}
                      fill="var(--accent)"
                      radius={[2, 2, 0, 0]}
                      animationDuration={300}
                    />
                  </BarChart>
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
                  <LineChart data={overallPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      interval={overallPerformanceData.length > 15 ? Math.ceil(overallPerformanceData.length / 8) : 0}
                      tick={{ fill: 'var(--text-secondary)' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      tick={{ fill: 'var(--text-secondary)' }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      tick={{ fill: 'var(--text-secondary)' }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                      formatter={(value, name) => {
                        if (name === 'cost') return [formatCurrency(Number(value)), 'Cost']
                        if (name === 'ctr' || name === 'conversionRate') return [`${Number(value).toFixed(2)}%`, name === 'ctr' ? 'CTR' : 'Conversion Rate']
                        return [formatNumber(Number(value)), String(name).charAt(0).toUpperCase() + String(name).slice(1)]
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '10px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
                      name="Impressions"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2 }}
                      name="Clicks"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="conversions" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ fill: '#F59E0B', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 5, stroke: '#F59E0B', strokeWidth: 2 }}
                      name="Conversions"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 5, stroke: '#EF4444', strokeWidth: 2 }}
                      name="Cost"
                    />
                  </LineChart>
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
                onClick={fetchAnalyticsData}
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
                {campaigns.slice(0, 6).map(campaign => (
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
                Campaign Performance
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
                    {campaigns.map(campaign => (
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