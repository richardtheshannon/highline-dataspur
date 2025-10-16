'use client'

import React from 'react'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { conversionFunnelDoc } from '@/data/helpDocumentation'

interface ConversionFunnelProps {
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  formatNumber: (num: number) => string
  formatPercentage: (value: number) => string
}

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
  totalImpressions,
  totalClicks,
  totalConversions,
  formatNumber,
  formatPercentage
}) => {
  // Calculate drop-off rates and percentages
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const cvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  const overallCvr = totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0

  // Calculate drop-offs
  const impressionToClickDropoff = totalImpressions - totalClicks
  const clickToConversionDropoff = totalClicks - totalConversions

  // Calculate funnel widths (as percentages)
  const impressionsWidth = 100
  const clicksWidth = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const conversionsWidth = totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0

  // Funnel efficiency score (0-100)
  const funnelEfficiency = overallCvr * 20 // Scale to 0-100 (assuming 5% conversion is excellent)
  const efficiencyScore = Math.min(funnelEfficiency, 100)

  const getEfficiencyStatus = (score: number) => {
    if (score >= 75) return { color: '#10b981', label: 'Excellent', icon: 'verified' }
    if (score >= 50) return { color: '#3b82f6', label: 'Good', icon: 'thumb_up' }
    if (score >= 25) return { color: '#f59e0b', label: 'Fair', icon: 'warning' }
    return { color: '#ef4444', label: 'Needs Work', icon: 'error' }
  }

  const efficiencyStatus = getEfficiencyStatus(efficiencyScore)

  // Identify bottleneck
  const bottleneck = ctr < 2 ? 'impression-to-click' : cvr < 2 ? 'click-to-conversion' : 'none'

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <DocumentedTitle
          className=""
          icon="filter_alt"
          title="Conversion Funnel Analysis"
          documentation={conversionFunnelDoc}
          as="h3"
        />
        {/* Efficiency Badge */}
        <div style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: efficiencyStatus.color + '20',
          color: efficiencyStatus.color,
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
            {efficiencyStatus.icon}
          </span>
          {efficiencyStatus.label} ({efficiencyScore.toFixed(0)}/100)
        </div>
      </div>
      <div className="card-content" style={{ padding: '1.5rem' }}>
        {/* Funnel Visualization */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Stage 1: Impressions */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              width: `${impressionsWidth}%`,
              background: 'linear-gradient(to right, #3b82f6, #2563eb)',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.25rem', fontWeight: '500' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>
                      visibility
                    </span>
                    Impressions
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                    {formatNumber(totalImpressions)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                    100%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Starting point
                  </div>
                </div>
              </div>
            </div>

            {/* Drop-off indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 0',
              gap: '0.5rem'
            }}>
              <div style={{ flex: 1, height: '2px', background: 'var(--border-color)' }}></div>
              <div style={{
                background: 'var(--background-secondary)',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#ef4444' }}>
                  trending_down
                </span>
                {formatNumber(impressionToClickDropoff)} dropped ({formatPercentage(100 - ctr)})
              </div>
              <div style={{ flex: 1, height: '2px', background: 'var(--border-color)' }}></div>
            </div>
          </div>

          {/* Stage 2: Clicks */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              width: `${Math.max(clicksWidth, 20)}%`,
              background: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
              marginLeft: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.25rem', fontWeight: '500' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>
                      ads_click
                    </span>
                    Clicks
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                    {formatNumber(totalClicks)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                    {formatPercentage(ctr)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Click rate
                  </div>
                </div>
              </div>
            </div>

            {/* Drop-off indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 0',
              gap: '0.5rem'
            }}>
              <div style={{ flex: 1, height: '2px', background: 'var(--border-color)' }}></div>
              <div style={{
                background: 'var(--background-secondary)',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#ef4444' }}>
                  trending_down
                </span>
                {formatNumber(clickToConversionDropoff)} dropped ({formatPercentage(100 - cvr)})
              </div>
              <div style={{ flex: 1, height: '2px', background: 'var(--border-color)' }}></div>
            </div>
          </div>

          {/* Stage 3: Conversions */}
          <div>
            <div style={{
              width: `${Math.max(conversionsWidth, 15)}%`,
              background: 'linear-gradient(to right, #10b981, #059669)',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              marginLeft: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.25rem', fontWeight: '500' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>
                      conversion_path
                    </span>
                    Conversions
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                    {formatNumber(totalConversions)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                    {formatPercentage(overallCvr)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Overall CVR
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funnel Metrics & Analysis */}
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
              Funnel Analysis
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {/* Stage 1 to 2 Efficiency */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Impression → Click
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: ctr >= 2 ? '#10b981' : '#ef4444' }}>
                {formatPercentage(ctr)}
              </div>
              <div style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '8px',
                background: ctr >= 2 ? '#10b98120' : '#ef444420',
                color: ctr >= 2 ? '#10b981' : '#ef4444',
                fontWeight: '500',
                display: 'inline-block',
                marginTop: '0.25rem'
              }}>
                {ctr >= 2 ? '✓ Good CTR' : '⚠ Low CTR'}
              </div>
            </div>

            {/* Stage 2 to 3 Efficiency */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Click → Conversion
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: cvr >= 2 ? '#10b981' : '#ef4444' }}>
                {formatPercentage(cvr)}
              </div>
              <div style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '8px',
                background: cvr >= 2 ? '#10b98120' : '#ef444420',
                color: cvr >= 2 ? '#10b981' : '#ef4444',
                fontWeight: '500',
                display: 'inline-block',
                marginTop: '0.25rem'
              }}>
                {cvr >= 2 ? '✓ Good CVR' : '⚠ Low CVR'}
              </div>
            </div>

            {/* Overall Efficiency */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Overall Conversion
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: overallCvr >= 1 ? '#10b981' : '#ef4444' }}>
                {formatPercentage(overallCvr)}
              </div>
              <div style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '8px',
                background: overallCvr >= 1 ? '#10b98120' : '#ef444420',
                color: overallCvr >= 1 ? '#10b981' : '#ef4444',
                fontWeight: '500',
                display: 'inline-block',
                marginTop: '0.25rem'
              }}>
                {overallCvr >= 1 ? '✓ Efficient' : '⚠ Needs Work'}
              </div>
            </div>
          </div>

          {/* Bottleneck Analysis */}
          {bottleneck !== 'none' && (
            <div style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#f59e0b', marginTop: '0.125rem' }}>
                  warning
                </span>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Bottleneck Detected
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {bottleneck === 'impression-to-click' ? (
                      <>
                        <strong>Low Click-Through Rate:</strong> Your ads are being shown but not generating enough clicks.
                        Consider improving ad copy, targeting, or creative elements.
                      </>
                    ) : (
                      <>
                        <strong>Low Conversion Rate:</strong> You're getting clicks but not converting visitors.
                        Review landing page experience, offer relevance, and conversion flow.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {bottleneck === 'none' && (
            <div style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: '#10b981' }}>✓ Healthy Funnel:</strong> Your conversion funnel is performing well across all stages.
              Continue monitoring and optimizing to maintain performance.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConversionFunnel
