import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Find user
    const [users] = await db.execute(
      'SELECT id, email, password FROM users WHERE email = ?',
      [email]
    ) as any[]

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate simple token
    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64')

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      userId: user.id,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
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
        message: 'Login error',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

