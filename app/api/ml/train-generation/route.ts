import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { trainGenerationModel } from '@/lib/ml/generationModel'

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
      epochs: body.epochs || 100,
      batchSize: body.batchSize || 32,
      learningRate: body.learningRate || 0.0005,
      hiddenLayers: body.hiddenLayers || [256, 128, 64],
      dropout: body.dropout || 0.3,
      validationSplit: body.validationSplit || 0.15,
    }

    // Launch training
    const result = await trainGenerationModel(config)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        modelId: result.modelId,
        recipeAccuracy: result.recipeAccuracy,
        ingredientF1: result.ingredientF1,
        priceMAE: result.priceMAE,
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
    console.error('Generation training error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error during generation training',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

