'use client'

import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PerformanceData {
  date: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
}

interface MultiMetricChartProps {
  data: PerformanceData[]
  formatNumber: (num: number) => string
  formatCurrency: (amount: number) => string
}

const MultiMetricChart: React.FC<MultiMetricChartProps> = ({ data, formatNumber, formatCurrency }) => {
  // Toggle state for each metric
  const [visibleMetrics, setVisibleMetrics] = useState({
    impressions: true,
    clicks: true,
    conversions: true,
    cost: true
  })

  // Metric configurations
  const metrics = [
    { key: 'impressions', label: 'Impressions', color: '#3b82f6', scale: 'left' },
    { key: 'clicks', label: 'Clicks', color: '#8b5cf6', scale: 'left' },
    { key: 'conversions', label: 'Conversions', color: '#10b981', scale: 'left' },
    { key: 'cost', label: 'Cost', color: '#ef4444', scale: 'right' }
  ]

  const toggleMetric = (metricKey: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metricKey]: !prev[metricKey]
    }))
  }

  // Format chart data with displayDate
  const chartData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  // Calculate correlations between metrics (simplified Pearson correlation)
  const calculateCorrelation = (metric1: keyof PerformanceData, metric2: keyof PerformanceData): number => {
    if (data.length < 2) return 0

    const values1 = data.map(d => d[metric1] as number)
    const values2 = data.map(d => d[metric2] as number)

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length

    let numerator = 0
    let denominator1 = 0
    let denominator2 = 0

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1
      const diff2 = values2[i] - mean2
      numerator += diff1 * diff2
      denominator1 += diff1 * diff1
      denominator2 += diff2 * diff2
    }

    if (denominator1 === 0 || denominator2 === 0) return 0

    return numerator / Math.sqrt(denominator1 * denominator2)
  }

  // Get correlations
  const correlations = {
    clicksImpressions: calculateCorrelation('clicks', 'impressions'),
    conversionsCost: calculateCorrelation('conversions', 'cost'),
    conversionsClicks: calculateCorrelation('conversions', 'clicks')
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.75rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 500, marginBottom: '0.5rem' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{
              color: entry.color,
              margin: 0,
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                background: entry.color,
                borderRadius: '2px'
              }}></span>
              {entry.dataKey === 'cost' ?
                `Cost: ${formatCurrency(entry.value)}` :
                `${entry.name}: ${formatNumber(entry.value)}`
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
            show_chart
          </span>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            Multi-Metric Trend Analysis
          </h3>
        </div>
        {/* Metric Toggle Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {metrics.map(metric => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key as keyof typeof visibleMetrics)}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: visibleMetrics[metric.key as keyof typeof visibleMetrics] ? metric.color + '20' : 'var(--border-color)',
                color: visibleMetrics[metric.key as keyof typeof visibleMetrics] ? metric.color : 'var(--text-secondary)',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: visibleMetrics[metric.key as keyof typeof visibleMetrics] ? metric.color : 'transparent',
                border: `2px solid ${metric.color}`
              }}></span>
              {metric.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-content" style={{ padding: '1.5rem' }}>
        {/* Chart */}
        <div style={{ width: '100%', height: '300px', marginBottom: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                stroke="var(--border-color)"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                stroke="var(--border-color)"
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
                  return value.toFixed(0)
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                stroke="var(--border-color)"
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem' }}
                iconType="circle"
              />
              {visibleMetrics.impressions && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Impressions"
                />
              )}
              {visibleMetrics.clicks && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Clicks"
                />
              )}
              {visibleMetrics.conversions && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversions"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Conversions"
                />
              )}
              {visibleMetrics.cost && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Cost"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation Analysis */}
        <div style={{
          background: 'var(--background-secondary)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent)' }}>
              analytics
            </span>
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Correlation Analysis
            </h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {/* Clicks vs Impressions */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Clicks ↔ Impressions
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: Math.abs(correlations.clicksImpressions) > 0.7 ? '#10b981' :
                         Math.abs(correlations.clicksImpressions) > 0.4 ? '#f59e0b' : '#ef4444'
                }}>
                  {correlations.clicksImpressions.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '8px',
                  background: Math.abs(correlations.clicksImpressions) > 0.7 ? '#10b98120' :
                             Math.abs(correlations.clicksImpressions) > 0.4 ? '#f59e0b20' : '#ef444420',
                  color: Math.abs(correlations.clicksImpressions) > 0.7 ? '#10b981' :
                         Math.abs(correlations.clicksImpressions) > 0.4 ? '#f59e0b' : '#ef4444',
                  fontWeight: '500'
                }}>
                  {Math.abs(correlations.clicksImpressions) > 0.7 ? 'Strong' :
                   Math.abs(correlations.clicksImpressions) > 0.4 ? 'Moderate' : 'Weak'}
                </div>
              </div>
            </div>

            {/* Conversions vs Cost */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Conversions ↔ Cost
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: Math.abs(correlations.conversionsCost) > 0.7 ? '#10b981' :
                         Math.abs(correlations.conversionsCost) > 0.4 ? '#f59e0b' : '#ef4444'
                }}>
                  {correlations.conversionsCost.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '8px',
                  background: Math.abs(correlations.conversionsCost) > 0.7 ? '#10b98120' :
                             Math.abs(correlations.conversionsCost) > 0.4 ? '#f59e0b20' : '#ef444420',
                  color: Math.abs(correlations.conversionsCost) > 0.7 ? '#10b981' :
                         Math.abs(correlations.conversionsCost) > 0.4 ? '#f59e0b' : '#ef4444',
                  fontWeight: '500'
                }}>
                  {Math.abs(correlations.conversionsCost) > 0.7 ? 'Strong' :
                   Math.abs(correlations.conversionsCost) > 0.4 ? 'Moderate' : 'Weak'}
                </div>
              </div>
            </div>

            {/* Conversions vs Clicks */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Conversions ↔ Clicks
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: Math.abs(correlations.conversionsClicks) > 0.7 ? '#10b981' :
                         Math.abs(correlations.conversionsClicks) > 0.4 ? '#f59e0b' : '#ef4444'
                }}>
                  {correlations.conversionsClicks.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '8px',
                  background: Math.abs(correlations.conversionsClicks) > 0.7 ? '#10b98120' :
                             Math.abs(correlations.conversionsClicks) > 0.4 ? '#f59e0b20' : '#ef444420',
                  color: Math.abs(correlations.conversionsClicks) > 0.7 ? '#10b981' :
                         Math.abs(correlations.conversionsClicks) > 0.4 ? '#f59e0b' : '#ef4444',
                  fontWeight: '500'
                }}>
                  {Math.abs(correlations.conversionsClicks) > 0.7 ? 'Strong' :
                   Math.abs(correlations.conversionsClicks) > 0.4 ? 'Moderate' : 'Weak'}
                </div>
              </div>
            </div>
          </div>
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}>
            Correlation ranges from -1 (inverse) to +1 (direct). Values closer to ±1 indicate stronger relationships.
          </div>
        </div>
      </div>
    </div>
  )
}

export default MultiMetricChart
