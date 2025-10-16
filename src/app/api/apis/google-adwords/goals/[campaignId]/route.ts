import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createId } from '@paralleldrive/cuid2'

/**
 * GET /api/apis/google-adwords/goals/[campaignId]
 * Fetch a specific campaign goal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
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

    const { campaignId } = params

    // Verify campaign belongs to user
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
      },
      include: {
        GoogleAdsCampaignGoal: true
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
      goal: campaign.GoogleAdsCampaignGoal
    })

  } catch (error) {
    console.error('Error fetching campaign goal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign goal' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/apis/google-adwords/goals/[campaignId]
 * Update a specific campaign goal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
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

    const { campaignId } = params
    const body = await request.json()
    const {
      targetCPA,
      targetROAS,
      dailyBudget,
      monthlyBudget,
      targetCTR,
      targetCVR,
      targetConversions,
      notes
    } = body

    // Verify campaign belongs to user
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

    // Check if goal exists
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
      // Create new goal if it doesn't exist
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
        title: 'Campaign goal updated',
        description: `Goal updated for campaign: ${campaign.name}`,
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
      message: 'Campaign goal updated successfully'
    })

  } catch (error) {
    console.error('Error updating campaign goal:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign goal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/apis/google-adwords/goals/[campaignId]
 * Delete a specific campaign goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
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

    const { campaignId } = params

    // Verify campaign belongs to user
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

    // Check if goal exists
    const existingGoal = await prisma.googleAdsCampaignGoal.findUnique({
      where: { campaignId }
    })

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Campaign goal not found' },
        { status: 404 }
      )
    }

    // Delete the goal
    await prisma.googleAdsCampaignGoal.delete({
      where: { campaignId }
    })

    // Log activity
    await prisma.apiActivity.create({
      data: {
        id: createId(),
        userId: user.id,
        apiConfigId: apiConfig.id,
        provider: 'GOOGLE_ADWORDS',
        type: 'GOAL_UPDATE',
        status: 'SUCCESS',
        title: 'Campaign goal deleted',
        description: `Goal deleted for campaign: ${campaign.name}`,
        metadata: {
          campaignId,
          campaignName: campaign.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Campaign goal deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting campaign goal:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign goal' },
      { status: 500 }
    )
  }
}
