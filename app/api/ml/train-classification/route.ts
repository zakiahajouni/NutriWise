import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { trainClassificationModel } from '@/lib/ml/classificationModel'

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

    const body = await request.json().catch(() => ({}))
    const config = {
      epochs: body.epochs || 50,
      batchSize: body.batchSize || 32,
      learningRate: body.learningRate || 0.001,
      hiddenLayers: body.hiddenLayers || [128, 64, 32],
      dropout: body.dropout || 0.3,
      validationSplit: body.validationSplit || 0.2,
    }

    // Launch training
    const result = await trainClassificationModel(config)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        modelId: result.modelId,
        accuracy: result.accuracy,
        precision: result.precision,
        recall: result.recall,
        f1Score: result.f1Score,
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
    console.error('Classification training error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error during classification training',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

