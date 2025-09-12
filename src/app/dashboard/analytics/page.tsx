'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ApiConfig {
  id: string
  apiType: string
  name: string
  status: 'active' | 'inactive' | 'error'
  lastSync?: string
  metrics?: {
    impressions?: number
    clicks?: number
    conversions?: number
    spend?: number
  }
}

interface AnalyticsMetrics {
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  clickThroughRate: number
  conversionRate: number
  costPerClick: number
  costPerConversion: number
}

export default function AnalyticsDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [aggregateMetrics, setAggregateMetrics] = useState<AnalyticsMetrics>({
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalSpend: 0,
    clickThroughRate: 0,
    conversionRate: 0,
    costPerClick: 0,
    costPerConversion: 0
  })
  const [timeRange, setTimeRange] = useState('30d')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (session?.user) {
      fetchApiConfigurations()
    }
  }, [session, timeRange])

  const fetchApiConfigurations = async () => {
    try {
      setLoading(true)
      
      // Fetch Google AdWords configuration
      const adWordsResponse = await fetch('/api/apis/google-adwords')
      
      if (!adWordsResponse.ok) {
        console.error('Failed to fetch Google AdWords config:', adWordsResponse.status)
        setLoading(false)
        return
      }
      
      const adWordsData = await adWordsResponse.json()
      
      const configs: ApiConfig[] = []
      
      // Check if the response has configuration data (configured: true)
      if (adWordsData.configured && adWordsData.id) {
        // If connected, fetch real metrics
        let metrics = undefined
        if (adWordsData.status === 'active') {
          try {
            const metricsResponse = await fetch(`/api/apis/google-adwords/metrics?timeRange=${timeRange}`)
            if (metricsResponse.ok) {
              const metricsData = await metricsResponse.json()
              metrics = {
                impressions: metricsData.metrics.totals.impressions,
                clicks: metricsData.metrics.totals.clicks,
                conversions: metricsData.metrics.totals.conversions,
                spend: metricsData.metrics.totals.cost
              }
            }
          } catch (error) {
            console.error('Error fetching metrics:', error)
          }
        }
        
        configs.push({
          id: adWordsData.id,
          apiType: 'google-adwords',
          name: 'Google AdWords',
          status: adWordsData.status === 'active' ? 'active' : 
                  adWordsData.status === 'error' ? 'error' : 'inactive',
          lastSync: adWordsData.updatedAt,
          metrics
        })
      }
      
      // Calculate aggregate metrics
      const totals = configs.reduce((acc, config) => {
        if (config.metrics) {
          acc.totalImpressions += config.metrics.impressions || 0
          acc.totalClicks += config.metrics.clicks || 0
          acc.totalConversions += config.metrics.conversions || 0
          acc.totalSpend += config.metrics.spend || 0
        }
        return acc
      }, {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalSpend: 0
      })
      
      setAggregateMetrics({
        ...totals,
        clickThroughRate: totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0,
        conversionRate: totals.totalClicks > 0 ? (totals.totalConversions / totals.totalClicks) * 100 : 0,
        costPerClick: totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0,
        costPerConversion: totals.totalConversions > 0 ? totals.totalSpend / totals.totalConversions : 0
      })
      
      setApiConfigs(configs)
    } catch (error) {
      console.error('Error fetching API configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter configurations based on search and status
  const filteredConfigs = useMemo(() => {
    return apiConfigs.filter(config => {
      const matchesSearch = config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           config.apiType.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || config.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }, [apiConfigs, searchTerm, filterStatus])

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return value.toFixed(2) + '%'
  }

  const getStatusBadge = (status: ApiConfig['status']) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    }
    return statusStyles[status]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading analytics data...</div>
      </div>
    )
  }

  return (
    <div className="safe-margin analytics-page">
      {/* Header with Actions - Matching Projects Page */}
      <div className="projects-header">
        <div>
          <h1 className="create-project-title">Analytics Dashboard</h1>
          <p className="create-project-subtitle">Monitor and analyze all your API integrations</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <Link 
            href="/dashboard/apis"
            className="form-btn form-btn-secondary flex items-center gap-2"
          >
            <span className="material-symbols-outlined">settings</span>
            Configure APIs
          </Link>
          <button 
            onClick={fetchApiConfigurations}
            className="form-btn form-btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            Refresh Data
          </button>
        </div>
      </div>
      
      <div className="create-project-container">

        {/* Key Metrics Statistics - Similar to Projects Statistics */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">analytics</span>
            Performance Metrics
          </h3>
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-value">{formatNumber(aggregateMetrics.totalImpressions)}</div>
              <div className="stats-label">Impressions</div>
            </div>
            <div className="stats-card">
              <div className="stats-value stats-value-blue">{formatNumber(aggregateMetrics.totalClicks)}</div>
              <div className="stats-label">Clicks</div>
              <div className="stats-sublabel">CTR: {formatPercentage(aggregateMetrics.clickThroughRate)}</div>
            </div>
            <div className="stats-card">
              <div className="stats-value stats-value-green">{formatNumber(aggregateMetrics.totalConversions)}</div>
              <div className="stats-label">Conversions</div>
              <div className="stats-sublabel">CVR: {formatPercentage(aggregateMetrics.conversionRate)}</div>
            </div>
            <div className="stats-card">
              <div className="stats-value stats-value-yellow">{formatCurrency(aggregateMetrics.totalSpend)}</div>
              <div className="stats-label">Total Spend</div>
              <div className="stats-sublabel">CPC: {formatCurrency(aggregateMetrics.costPerClick)}</div>
            </div>
            <div className="stats-card">
              <div className="stats-value stats-value-gray">{formatCurrency(aggregateMetrics.costPerConversion)}</div>
              <div className="stats-label">Cost per Conversion</div>
            </div>
          </div>
        </div>

        {/* Filters and Search - Matching Projects Page */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">filter_list</span>
            Filter & Search
          </h3>
          <div className="filter-controls">
            <div className="filter-selects-row">
              <select
                className="form-input form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
              <select
                className="form-input form-select"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            <div className="filter-search">
              <input
                type="text"
                placeholder="Search integrations..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* API Integrations Table - Matching Projects Table */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">api</span>
            API Integrations
          </h3>
          <div className="projects-table-container">
            <div className="table-wrapper">
              <table className="projects-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell">Integration</th>
                    <th className="table-cell">Status</th>
                    <th className="table-cell">Impressions</th>
                    <th className="table-cell">Clicks</th>
                    <th className="table-cell">Conversions</th>
                    <th className="table-cell">Spend</th>
                    <th className="table-cell">Last Sync</th>
                    <th className="table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredConfigs.map(config => (
                    <tr key={config.id} className="table-row">
                      <td className="table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>
                            {config.apiType === 'google-adwords' ? 'ads_click' : 'api'}
                          </span>
                          <div>
                            <div className="project-name">{config.name}</div>
                            <div className="project-description">{config.apiType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`status-badge ${getStatusBadge(config.status)}`}>
                          {config.status}
                        </span>
                      </td>
                      <td className="table-cell table-text">
                        {config.metrics ? formatNumber(config.metrics.impressions || 0) : '-'}
                      </td>
                      <td className="table-cell table-text">
                        {config.metrics ? formatNumber(config.metrics.clicks || 0) : '-'}
                      </td>
                      <td className="table-cell table-text">
                        {config.metrics ? formatNumber(config.metrics.conversions || 0) : '-'}
                      </td>
                      <td className="table-cell table-text">
                        {config.metrics ? formatCurrency(config.metrics.spend || 0) : '-'}
                      </td>
                      <td className="table-cell table-text">
                        {config.lastSync ? new Date(config.lastSync).toLocaleString() : 'Never'}
                      </td>
                      <td className="table-cell">
                        <div className="action-buttons">
                          <button 
                            onClick={() => router.push(`/dashboard/analytics/${config.apiType}`)}
                            className="action-btn action-btn-view"
                            title="View Analytics"
                          >
                            <span className="material-symbols-outlined">analytics</span>
                          </button>
                          <button 
                            onClick={() => router.push(`/dashboard/apis/${config.apiType}`)}
                            className="action-btn action-btn-edit"
                            title="Configure"
                          >
                            <span className="material-symbols-outlined">settings</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredConfigs.length === 0 && (
                <div className="empty-state">
                  <span className="material-symbols-outlined empty-icon">api_off</span>
                  <div className="empty-text">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'No integrations match your filters' 
                      : 'No API integrations found. Configure your first API!'}
                  </div>
                  {!searchTerm && filterStatus === 'all' && (
                    <Link href="/dashboard/apis" className="form-btn form-btn-primary" style={{ marginTop: '1rem' }}>
                      <span className="material-symbols-outlined">add</span>
                      Add API Integration
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Matching Projects Page Style */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">flash_on</span>
            Quick Actions
          </h3>
          <div className="quick-actions-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <Link 
              href="/dashboard/analytics/google-adwords" 
              className="quick-action-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>ads_click</span>
              <span>Google AdWords Analytics</span>
            </Link>
            <button 
              className="quick-action-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>download</span>
              <span>Export Report</span>
            </button>
            <button 
              className="quick-action-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>schedule</span>
              <span>Schedule Reports</span>
            </button>
            <button 
              className="quick-action-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>notifications</span>
              <span>Set Alerts</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-sublabel {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .quick-action-card:hover {
          border-color: var(--accent) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}