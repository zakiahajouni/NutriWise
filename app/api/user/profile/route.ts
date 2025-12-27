import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthToken, verifyToken } from '@/lib/auth'

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

    // Get user and profile
    const [users] = await db.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      [decoded.userId]
    ) as any[]

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Get profile
    const [profiles] = await db.execute(
      `SELECT age, gender, height, weight, activity_level, dietary_preference, allergies, health_conditions 
       FROM user_profiles WHERE user_id = ?`,
      [decoded.userId]
    ) as any[]

    const profile = profiles && profiles.length > 0 ? profiles[0] : null

    return NextResponse.json({
      success: true,
      profile: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        age: profile?.age || null,
        gender: profile?.gender || null,
        height: profile?.height || null,
        weight: profile?.weight || null,
        activityLevel: profile?.activity_level || null,
        dietaryPreference: profile?.dietary_preference || null,
        allergies: profile?.allergies ? JSON.parse(profile.allergies) : [],
        healthConditions: profile?.health_conditions ? JSON.parse(profile.health_conditions) : [],
      },
    })
  } catch (error: any) {
    console.error('Profile fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Error fetching profile' },
        { status: 500 }
      )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const {
      firstName,
      lastName,
      age,
      gender,
      height,
      weight,
      activityLevel,
      allergies,
      dietaryPreference,
      healthConditions,
    } = body

    // Update user information
    await db.execute(
      'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
      [firstName, lastName, decoded.userId]
    )

    // Check if profile exists
    const [profiles] = await db.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [decoded.userId]
    ) as any[]

    if (profiles && profiles.length > 0) {
      // Update existing profile
      await db.execute(
        `UPDATE user_profiles 
         SET age = ?, gender = ?, height = ?, weight = ?, activity_level = ?, 
             dietary_preference = ?, allergies = ?, health_conditions = ?
         WHERE user_id = ?`,
        [
          parseInt(age),
          gender,
          parseFloat(height),
          parseFloat(weight),
          activityLevel,
          dietaryPreference,
          JSON.stringify(allergies || []),
          JSON.stringify(healthConditions || []),
          decoded.userId,
        ]
      )
    } else {
      // Create new profile
      await db.execute(
        `INSERT INTO user_profiles 
         (user_id, age, gender, height, weight, activity_level, dietary_preference, allergies, health_conditions) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          decoded.userId,
          parseInt(age),
          gender,
          parseFloat(height),
          parseFloat(weight),
          activityLevel,
          dietaryPreference,
          JSON.stringify(allergies || []),
          JSON.stringify(healthConditions || []),
        ]
      )
    }

    // Synchroniser avec l'API ML Python (fichier JSON statique)
    try {
      // Récupérer l'email de l'utilisateur
      const [users] = await db.execute(
        'SELECT email FROM users WHERE id = ?',
        [decoded.userId]
      ) as any[]
      
      if (users && users.length > 0) {
        const mlApiUrl = process.env.ML_API_URL || 'http://localhost:5000'
        await fetch(`${mlApiUrl}/api/ml/sync-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: decoded.userId,
            email: users[0].email,
            profile: {
              age: parseInt(age),
              gender,
              activity_level: activityLevel,
              dietary_preference: dietaryPreference,
              allergies: allergies || [],
              health_conditions: healthConditions || [],
            },
          }),
        }).catch((err) => {
          // Ne pas bloquer la mise à jour si l'API ML n'est pas disponible
          console.warn('Failed to sync user to ML API:', err.message)
        })
      }
    } catch (error: any) {
      // Ne pas bloquer la mise à jour si la synchronisation échoue
      console.warn('Failed to sync user to ML API:', error.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
      return NextResponse.json(
        { success: false, message: 'Error updating profile' },
        { status: 500 }
      )
  }
}
