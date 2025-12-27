import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { trainClassification } from '@/lib/ml_api_client'

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

    // Appeler l'API Python ML pour l'entraînement
    const result = await trainClassification()

    return NextResponse.json({
      success: result.success || true,
      message: result.message || 'Training started',
      modelId: result.modelId,
    })
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

