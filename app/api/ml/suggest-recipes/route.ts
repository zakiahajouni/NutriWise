import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import db from '@/lib/db'
import { suggestRecipes } from '@/lib/ml_api_client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get user profile from database
    const [profiles] = await db.execute(
      `SELECT age, gender, dietary_preference, allergies, health_conditions, activity_level
       FROM user_profiles WHERE user_id = ?`,
      [decoded.userId]
    ) as any[]

    const profile = profiles && profiles.length > 0 ? profiles[0] : null

    try {
      // Appeler l'API Python ML
      const result = await suggestRecipes(decoded.userId, profile)
      
      return NextResponse.json({
        success: true,
        suggestions: result.suggestions || []
      })
    } catch (error: any) {
      console.error('Error calling ML API:', error)
      
      // Fallback si l'API Python n'est pas disponible
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'ML service unavailable. Please try again later.'
      })
    }
  } catch (error: any) {
    console.error('Error generating recipe suggestions:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error generating suggestions',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * Generate a human-readable reason why this recipe matches the user's profile
 */
function getMatchReason(profile: any, recipe: any): string {
  const reasons = []
  
  if (profile.dietary_preference === 'vegetarian' || profile.dietary_preference === 'vegan') {
    if (recipe.isHealthy) {
      reasons.push('Healthy option')
    }
  }
  
  if (recipe.isHealthy && profile.dietary_preference === 'healthy') {
    reasons.push('Matches your healthy preference')
  }
  
  if (profile.activity_level === 'very_active' || profile.activity_level === 'active') {
    if (recipe.calories > 400) {
      reasons.push('High energy for active lifestyle')
    }
  }
  
  if (reasons.length === 0) {
    return 'Personalized for you'
  }
  
  return reasons.join(' • ')
}

