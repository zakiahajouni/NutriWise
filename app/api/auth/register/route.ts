import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
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

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate gender (must be 'male' or 'female')
    if (!gender || (gender !== 'male' && gender !== 'female')) {
      return NextResponse.json(
        { success: false, message: 'Gender must be male or female' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'This email is already in use' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName]
    ) as any

    const userId = result.insertId

    // Create user profile
    await db.execute(
      `INSERT INTO user_profiles 
       (user_id, age, gender, height, weight, activity_level, dietary_preference, allergies, health_conditions) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
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

    // Update statistics
    await db.execute('UPDATE site_stats SET total_users = total_users + 1')

    // Generate simple token (in a real project, use JWT)
    const token = Buffer.from(`${userId}:${email}`).toString('base64')

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      token,
      userId,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack
    })
    
    // Check if it's a database connection error
    if (error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection failed. Please ensure MySQL is running.',
          error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error creating account',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

