'use client'

import React, { useState } from 'react'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { performanceHeatmapDoc } from '@/data/helpDocumentation'

interface PerformanceData {
  date: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
}

interface PerformanceHeatmapProps {
  data: PerformanceData[]
  formatNumber: (num: number) => string
  formatCurrency: (amount: number) => string
}

const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({ data, formatNumber, formatCurrency }) => {
  const [selectedMetric, setSelectedMetric] = useState<'conversions' | 'clicks' | 'cost' | 'ctr'>('conversions')

  // Days of the week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Aggregate data by day of week
  const aggregateByDayOfWeek = () => {
    const dayData: { [key: number]: { impressions: number; clicks: number; conversions: number; cost: number; count: number } } = {}

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      dayData[i] = { impressions: 0, clicks: 0, conversions: 0, cost: 0, count: 0 }
    }

    // Aggregate data
    data.forEach(item => {
      const date = new Date(item.date)
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      dayData[dayOfWeek].impressions += item.impressions
      dayData[dayOfWeek].clicks += item.clicks
      dayData[dayOfWeek].conversions += item.conversions
      dayData[dayOfWeek].cost += item.cost
      dayData[dayOfWeek].count++
    })

    // Calculate averages and metrics
    return Object.keys(dayData).map(key => {
      const day = parseInt(key)
      const d = dayData[day]
      const avgImpressions = d.count > 0 ? d.impressions / d.count : 0
      const avgClicks = d.count > 0 ? d.clicks / d.count : 0
      const avgConversions = d.count > 0 ? d.conversions / d.count : 0
      const avgCost = d.count > 0 ? d.cost / d.count : 0
      const ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0

      return {
        day,
        dayName: daysOfWeek[day],
        impressions: avgImpressions,
        clicks: avgClicks,
        conversions: avgConversions,
        cost: avgCost,
        ctr,
        count: d.count
      }
    })
  }

  const dayMetrics = aggregateByDayOfWeek()

  // Get min and max values for the selected metric
  const getMinMax = () => {
    const values = dayMetrics.map(d => d[selectedMetric])
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }

  const { min, max } = getMinMax()

  // Get color intensity based on value (0-1 scale)
  const getColorIntensity = (value: number): string => {
    if (max === min) return '0.5'
    const intensity = (value - min) / (max - min)
    return intensity.toFixed(2)
  }

  // Get background color based on metric
  const getBackgroundColor = (value: number): string => {
    const intensity = getColorIntensity(value)

    switch (selectedMetric) {
      case 'conversions':
        return `rgba(16, 185, 129, ${intensity})` // Green
      case 'clicks':
        return `rgba(139, 92, 246, ${intensity})` // Purple
      case 'cost':
        return `rgba(239, 68, 68, ${intensity})` // Red
      case 'ctr':
        return `rgba(59, 130, 246, ${intensity})` // Blue
      default:
        return `rgba(107, 114, 128, ${intensity})` // Gray
    }
  }

  // Format value based on metric
  const formatValue = (value: number, metric: string): string => {
    switch (metric) {
      case 'cost':
        return formatCurrency(value)
      case 'ctr':
        return `${value.toFixed(2)}%`
      case 'conversions':
      case 'clicks':
        return formatNumber(value)
      default:
        return value.toFixed(0)
    }
  }

  // Get best and worst performing days
  const bestDay = dayMetrics.reduce((best, current) =>
    current[selectedMetric] > best[selectedMetric] ? current : best
  )
  const worstDay = dayMetrics.reduce((worst, current) =>
    current[selectedMetric] < worst[selectedMetric] ? current : worst
  )

  const metricOptions = [
    { value: 'conversions', label: 'Conversions', icon: 'conversion_path', color: '#10b981' },
    { value: 'clicks', label: 'Clicks', icon: 'ads_click', color: '#8b5cf6' },
    { value: 'cost', label: 'Cost', icon: 'payments', color: '#ef4444' },
    { value: 'ctr', label: 'CTR', icon: 'percent', color: '#3b82f6' }
  ]

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <DocumentedTitle
          className=""
          icon="calendar_view_week"
          title="Day-of-Week Performance"
          documentation={performanceHeatmapDoc}
          as="h3"
        />
        {/* Metric Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {metricOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedMetric(option.value as any)}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: selectedMetric === option.value ? option.color + '20' : 'var(--border-color)',
                color: selectedMetric === option.value ? option.color : 'var(--text-secondary)',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
                {option.icon}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-content" style={{ padding: '1.5rem' }}>
        {/* Heatmap Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {dayMetrics.map(day => (
            <div
              key={day.day}
              style={{
                background: getBackgroundColor(day[selectedMetric]),
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                position: 'relative'
              }}
              className="heatmap-cell"
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {day.dayName.substring(0, 3)}
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}>
                {formatValue(day[selectedMetric], selectedMetric)}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)'
              }}>
                {day.count} days
              </div>
              {/* Best/Worst Badge */}
              {day.day === bestDay.day && (
                <div style={{
                  position: 'absolute',
                  top: '0.25rem',
                  right: '0.25rem',
                  fontSize: '0.875rem',
                  color: '#10b981'
                }}>
                  🏆
                </div>
              )}
              {day.day === worstDay.day && bestDay.day !== worstDay.day && (
                <div style={{
                  position: 'absolute',
                  top: '0.25rem',
                  right: '0.25rem',
                  fontSize: '0.875rem',
                  color: '#ef4444'
                }}>
                  ⚠️
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Insights */}
        <div style={{
          background: 'var(--background-secondary)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent)' }}>
              lightbulb
            </span>
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Day-of-Week Insights
            </h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {/* Best Performing Day */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <span style={{ color: '#10b981', fontSize: '1rem', marginRight: '0.25rem' }}>🏆</span>
                Best Performing Day
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {bestDay.dayName}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {formatValue(bestDay[selectedMetric], selectedMetric)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Average based on {bestDay.count} days of data
              </div>
            </div>

            {/* Worst Performing Day */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <span style={{ color: '#ef4444', fontSize: '1rem', marginRight: '0.25rem' }}>⚠️</span>
                Lowest Performing Day
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {worstDay.dayName}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {formatValue(worstDay[selectedMetric], selectedMetric)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Average based on {worstDay.count} days of data
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>💡 Recommendation:</strong>{' '}
            {bestDay.day === worstDay.day
              ? 'Performance is consistent across all days of the week.'
              : `Consider increasing bids on ${bestDay.dayName}s and reducing spend on ${worstDay.dayName}s for optimal ROI.`
            }
          </div>
        </div>
      </div>

      <style jsx>{`
        .heatmap-cell:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  )
}

export default PerformanceHeatmap
