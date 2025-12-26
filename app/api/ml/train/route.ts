import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { trainRecommendationModel, TrainingConfig } from '@/lib/ml/trainer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Optional: check if user is admin
    // For now, all authenticated users can train

    const body = await request.json().catch(() => ({}))
    const config: TrainingConfig = {
      epochs: body.epochs || 50,
      batchSize: body.batchSize || 32,
      learningRate: body.learningRate || 0.001,
      hiddenLayers: body.hiddenLayers || [128, 64, 32],
      dropout: body.dropout || 0.2,
      validationSplit: body.validationSplit || 0.2,
    }

    // Launch training (may take time)
    const result = await trainRecommendationModel(config)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        modelId: result.modelId,
        accuracy: result.accuracy,
        loss: result.loss,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Training error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error during training',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

