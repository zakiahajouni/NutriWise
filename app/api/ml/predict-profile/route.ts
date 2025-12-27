import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { predictProfile, PredictProfileResponse } from '@/lib/ml_api_client'

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

    try {
      // Appeler l'API Python ML
      const result: PredictProfileResponse = await predictProfile(decoded.userId)
      
      return NextResponse.json({
        success: true,
        profile: result,
      })
    } catch (error: any) {
      console.error('Error calling ML API:', error)
      
      // Fallback si l'API Python n'est pas disponible
      return NextResponse.json(
        {
          success: false,
          message: 'ML service unavailable. Please try again later.',
        },
        { status: 503 }
      )
    }
  } catch (error: any) {
    console.error('Erreur prédiction profil:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error predicting profile',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

