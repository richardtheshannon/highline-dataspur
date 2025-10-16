import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createId } from '@paralleldrive/cuid2'

/**
 * GET /api/apis/google-adwords/goals
 * Fetch all campaign goals for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's API configuration
    const apiConfig = await prisma.apiConfiguration.findFirst({
      where: {
        userId: user.id,
        provider: 'GOOGLE_ADWORDS',
        status: 'ACTIVE'
      }
    })

    if (!apiConfig) {
      return NextResponse.json({
        error: 'No active Google Ads configuration found',
        goals: []
      }, { status: 200 })
    }

    // Fetch all campaigns with their goals
    const campaigns = await prisma.googleAdsCampaign.findMany({
      where: {
        apiConfigId: apiConfig.id
      },
      include: {
        GoogleAdsCampaignGoal: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Format response
    const goalsData = campaigns.map(campaign => ({
      campaignId: campaign.id,
      campaignName: campaign.name,
      campaignStatus: campaign.status,
      goal: campaign.GoogleAdsCampaignGoal ? {
        id: campaign.GoogleAdsCampaignGoal.id,
        targetCPA: campaign.GoogleAdsCampaignGoal.targetCPA,
        targetROAS: campaign.GoogleAdsCampaignGoal.targetROAS,
        dailyBudget: campaign.GoogleAdsCampaignGoal.dailyBudget,
        monthlyBudget: campaign.GoogleAdsCampaignGoal.monthlyBudget,
        targetCTR: campaign.GoogleAdsCampaignGoal.targetCTR,
        targetCVR: campaign.GoogleAdsCampaignGoal.targetCVR,
        targetConversions: campaign.GoogleAdsCampaignGoal.targetConversions,
        notes: campaign.GoogleAdsCampaignGoal.notes,
        createdAt: campaign.GoogleAdsCampaignGoal.createdAt,
        updatedAt: campaign.GoogleAdsCampaignGoal.updatedAt
      } : null
    }))

    return NextResponse.json({
      success: true,
      goals: goalsData
    })

  } catch (error) {
    console.error('Error fetching campaign goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign goals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/apis/google-adwords/goals
 * Create or update a campaign goal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      campaignId,
      targetCPA,
      targetROAS,
      dailyBudget,
      monthlyBudget,
      targetCTR,
      targetCVR,
      targetConversions,
      notes
    } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and belongs to user
    const apiConfig = await prisma.apiConfiguration.findFirst({
      where: {
        userId: user.id,
        provider: 'GOOGLE_ADWORDS',
        status: 'ACTIVE'
      }
    })

    if (!apiConfig) {
      return NextResponse.json(
        { error: 'No active Google Ads configuration found' },
        { status: 404 }
      )
    }

    const campaign = await prisma.googleAdsCampaign.findFirst({
      where: {
        id: campaignId,
        apiConfigId: apiConfig.id
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if goal already exists
    const existingGoal = await prisma.googleAdsCampaignGoal.findUnique({
      where: { campaignId }
    })

    let goal

    if (existingGoal) {
      // Update existing goal
      goal = await prisma.googleAdsCampaignGoal.update({
        where: { campaignId },
        data: {
          targetCPA: targetCPA !== undefined ? targetCPA : existingGoal.targetCPA,
          targetROAS: targetROAS !== undefined ? targetROAS : existingGoal.targetROAS,
          dailyBudget: dailyBudget !== undefined ? dailyBudget : existingGoal.dailyBudget,
          monthlyBudget: monthlyBudget !== undefined ? monthlyBudget : existingGoal.monthlyBudget,
          targetCTR: targetCTR !== undefined ? targetCTR : existingGoal.targetCTR,
          targetCVR: targetCVR !== undefined ? targetCVR : existingGoal.targetCVR,
          targetConversions: targetConversions !== undefined ? targetConversions : existingGoal.targetConversions,
          notes: notes !== undefined ? notes : existingGoal.notes,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new goal
      goal = await prisma.googleAdsCampaignGoal.create({
        data: {
          id: createId(),
          campaignId,
          targetCPA: targetCPA || null,
          targetROAS: targetROAS || null,
          dailyBudget: dailyBudget || null,
          monthlyBudget: monthlyBudget || null,
          targetCTR: targetCTR || null,
          targetCVR: targetCVR || null,
          targetConversions: targetConversions || null,
          notes: notes || null,
          updatedAt: new Date()
        }
      })
    }

    // Log activity
    await prisma.apiActivity.create({
      data: {
        id: createId(),
        userId: user.id,
        apiConfigId: apiConfig.id,
        provider: 'GOOGLE_ADWORDS',
        type: 'GOAL_UPDATE',
        status: 'SUCCESS',
        title: `Campaign goal ${existingGoal ? 'updated' : 'created'}`,
        description: `Goal ${existingGoal ? 'updated' : 'set'} for campaign: ${campaign.name}`,
        metadata: {
          campaignId,
          campaignName: campaign.name,
          goalId: goal.id
        }
      }
    })

    return NextResponse.json({
      success: true,
      goal,
      message: `Campaign goal ${existingGoal ? 'updated' : 'created'} successfully`
    })

  } catch (error) {
    console.error('Error creating/updating campaign goal:', error)
    return NextResponse.json(
      { error: 'Failed to save campaign goal' },
      { status: 500 }
    )
  }
}
