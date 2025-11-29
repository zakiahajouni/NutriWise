import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import db from '@/lib/db'
import { predictUserProfile } from '@/lib/ml/recipeGenerator'

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

    // Get user profile from DB
    const [profiles] = await db.execute(
      `SELECT age, gender, dietary_preference, allergies, health_conditions 
       FROM user_profiles WHERE user_id = ?`,
      [decoded.userId]
    ) as any[]

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      )
    }

    const profile = profiles[0]

    // Predict profile with ML model
    const predictedProfile = predictUserProfile({
      age: profile.age,
      gender: profile.gender,
      dietaryPreference: profile.dietary_preference,
      allergies: profile.allergies ? JSON.parse(profile.allergies) : [],
      healthConditions: profile.health_conditions ? JSON.parse(profile.health_conditions) : [],
    })

    return NextResponse.json({
      success: true,
      profile: predictedProfile,
    })
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

