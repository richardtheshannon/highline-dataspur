'use client'

import { useState, useEffect } from 'react'

interface CampaignGoal {
  campaignId: string
  campaignName: string
  campaignStatus: string
  goal: {
    id: string
    targetCPA?: number | null
    targetROAS?: number | null
    dailyBudget?: number | null
    monthlyBudget?: number | null
    targetCTR?: number | null
    targetCVR?: number | null
    targetConversions?: number | null
    notes?: string | null
  } | null
}

interface CampaignMetrics {
  campaignId: string
  actualCPA: number
  actualCTR: number
  actualCVR: number
  actualConversions: number
  totalCost: number
}

interface GoalTrackerProps {
  campaigns: Array<{
    id: string
    name: string
    status: string
    cpa: number
    ctr: number
    conversionRate: number
    conversions: number
    cost: number
  }>
  formatCurrency: (amount: number) => string
  formatPercentage: (value: number) => string
  formatNumber: (num: number) => string
}

export default function GoalTracker({
  campaigns,
  formatCurrency,
  formatPercentage,
  formatNumber
}: GoalTrackerProps) {
  const [campaignGoals, setCampaignGoals] = useState<CampaignGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null)
  const [goalForm, setGoalForm] = useState<{
    targetCPA?: number
    targetCTR?: number
    targetCVR?: number
    targetConversions?: number
    monthlyBudget?: number
    notes?: string
  }>({})

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apis/google-adwords/goals')
      const data = await response.json()

      if (data.success) {
        setCampaignGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditGoal = (campaignId: string, existingGoal: CampaignGoal['goal'] | undefined) => {
    setEditingCampaign(campaignId)
    setGoalForm({
      targetCPA: existingGoal?.targetCPA || undefined,
      targetCTR: existingGoal?.targetCTR || undefined,
      targetCVR: existingGoal?.targetCVR || undefined,
      targetConversions: existingGoal?.targetConversions || undefined,
      monthlyBudget: existingGoal?.monthlyBudget || undefined,
      notes: existingGoal?.notes || undefined
    })
  }

  const handleSaveGoal = async (campaignId: string) => {
    try {
      const response = await fetch('/api/apis/google-adwords/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          ...goalForm
        })
      })

      const data = await response.json()

      if (data.success) {
        await fetchGoals()
        setEditingCampaign(null)
        setGoalForm({})
      } else {
        alert('Failed to save goal: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving goal:', error)
      alert('Error saving goal')
    }
  }

  const handleCancelEdit = () => {
    setEditingCampaign(null)
    setGoalForm({})
  }

  const getGoalProgress = (actual: number, target: number | undefined | null, isLowerBetter: boolean = false) => {
    if (!target || target === 0) return { percentage: 0, status: 'no-target', label: 'No Target' }

    const ratio = actual / target
    let percentage: number
    let status: string

    if (isLowerBetter) {
      // For metrics like CPA where lower is better
      percentage = Math.min((target / actual) * 100, 100)
      if (actual <= target) {
        status = 'excellent'
      } else if (actual <= target * 1.2) {
        status = 'good'
      } else {
        status = 'needs-improvement'
      }
    } else {
      // For metrics like CTR, CVR, Conversions where higher is better
      percentage = Math.min((actual / target) * 100, 100)
      if (actual >= target) {
        status = 'excellent'
      } else if (actual >= target * 0.8) {
        status = 'good'
      } else {
        status = 'needs-improvement'
      }
    }

    return {
      percentage: Math.round(percentage),
      status,
      label: status === 'excellent' ? '✓ On Track' : status === 'good' ? 'Near Target' : '⚠ Below Target'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981'
      case 'good': return '#3b82f6'
      case 'needs-improvement': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
              flag
            </span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Campaign Goals & Tracking
            </h3>
          </div>
        </div>
        <div className="card-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }}>
            hourglass_empty
          </span>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
            flag
          </span>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            Campaign Goals & Tracking
          </h3>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Set targets and track performance
        </div>
      </div>
      <div className="card-content" style={{ padding: '1.5rem' }}>
        {campaigns.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.5 }}>
              trending_up
            </span>
            <p style={{ marginTop: '1rem' }}>No campaigns available to track</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {campaigns.filter(c => c.status === 'enabled').map((campaign) => {
              const goalData = campaignGoals.find(g => g.campaignId === campaign.id)
              const goal = goalData?.goal
              const isEditing = editingCampaign === campaign.id

              // Calculate progress for each metric
              const cpaProgress = getGoalProgress(campaign.cpa, goal?.targetCPA, true)
              const ctrProgress = getGoalProgress(campaign.ctr, goal?.targetCTR, false)
              const cvrProgress = getGoalProgress(campaign.conversionRate, goal?.targetCVR, false)
              const conversionsProgress = getGoalProgress(campaign.conversions, goal?.targetConversions, false)

              return (
                <div
                  key={campaign.id}
                  style={{
                    padding: '1.5rem',
                    background: 'var(--background-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {/* Campaign Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {campaign.name}
                      </h4>
                      {goal?.notes && !isEditing && (
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          {goal.notes}
                        </p>
                      )}
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => handleEditGoal(campaign.id, goal)}
                        className="form-btn form-btn-sm form-btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                          {goal ? 'edit' : 'add'}
                        </span>
                        {goal ? 'Edit Goals' : 'Set Goals'}
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    /* Goal Edit Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Target CPA ($)
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            value={goalForm.targetCPA || ''}
                            onChange={(e) => setGoalForm({ ...goalForm, targetCPA: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="e.g., 50"
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Target CTR (%)
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            value={goalForm.targetCTR || ''}
                            onChange={(e) => setGoalForm({ ...goalForm, targetCTR: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="e.g., 2.5"
                            step="0.1"
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Target CVR (%)
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            value={goalForm.targetCVR || ''}
                            onChange={(e) => setGoalForm({ ...goalForm, targetCVR: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="e.g., 3.0"
                            step="0.1"
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Target Conversions
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            value={goalForm.targetConversions || ''}
                            onChange={(e) => setGoalForm({ ...goalForm, targetConversions: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="e.g., 100"
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          Monthly Budget ($)
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          value={goalForm.monthlyBudget || ''}
                          onChange={(e) => setGoalForm({ ...goalForm, monthlyBudget: e.target.value ? parseFloat(e.target.value) : undefined })}
                          placeholder="e.g., 5000"
                          style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          Notes
                        </label>
                        <textarea
                          className="form-input"
                          value={goalForm.notes || ''}
                          onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                          placeholder="Optional notes about campaign goals..."
                          rows={2}
                          style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', resize: 'vertical' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleCancelEdit}
                          className="form-btn form-btn-sm form-btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveGoal(campaign.id)}
                          className="form-btn form-btn-sm form-btn-primary"
                        >
                          Save Goals
                        </button>
                      </div>
                    </div>
                  ) : goal ? (
                    /* Goal Progress Display */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      {/* CPA Progress */}
                      {goal.targetCPA && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cost Per Acquisition</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getStatusColor(cpaProgress.status) }}>
                              {cpaProgress.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {formatCurrency(campaign.cpa)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Target: {formatCurrency(goal.targetCPA)}
                            </span>
                          </div>
                          <div style={{
                            height: '6px',
                            background: 'var(--border-color)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${cpaProgress.percentage}%`,
                              background: getStatusColor(cpaProgress.status),
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                        </div>
                      )}

                      {/* CTR Progress */}
                      {goal.targetCTR && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click-Through Rate</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getStatusColor(ctrProgress.status) }}>
                              {ctrProgress.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {formatPercentage(campaign.ctr)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Target: {formatPercentage(goal.targetCTR)}
                            </span>
                          </div>
                          <div style={{
                            height: '6px',
                            background: 'var(--border-color)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${ctrProgress.percentage}%`,
                              background: getStatusColor(ctrProgress.status),
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                        </div>
                      )}

                      {/* CVR Progress */}
                      {goal.targetCVR && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Conversion Rate</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getStatusColor(cvrProgress.status) }}>
                              {cvrProgress.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {formatPercentage(campaign.conversionRate)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Target: {formatPercentage(goal.targetCVR)}
                            </span>
                          </div>
                          <div style={{
                            height: '6px',
                            background: 'var(--border-color)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${cvrProgress.percentage}%`,
                              background: getStatusColor(cvrProgress.status),
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                        </div>
                      )}

                      {/* Conversions Progress */}
                      {goal.targetConversions && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Conversions</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getStatusColor(conversionsProgress.status) }}>
                              {conversionsProgress.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {formatNumber(campaign.conversions)}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Target: {formatNumber(goal.targetConversions)}
                            </span>
                          </div>
                          <div style={{
                            height: '6px',
                            background: 'var(--border-color)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${conversionsProgress.percentage}%`,
                              background: getStatusColor(conversionsProgress.status),
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No Goals Set */
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>No goals set for this campaign</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem' }}>Click "Set Goals" to define targets</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
