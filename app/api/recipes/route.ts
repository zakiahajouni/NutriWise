import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthToken, verifyToken } from '@/lib/auth'

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

    // Get user recipes
    const [recipes] = await db.execute(
      `SELECT id, title, description, prep_time, cook_time, servings, calories, created_at 
       FROM recipes WHERE user_id = ? ORDER BY created_at DESC`,
      [decoded.userId]
    ) as any[]

    return NextResponse.json({
      success: true,
      recipes: recipes || [],
    })
  } catch (error: any) {
    console.error('Recipes fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Error fetching recipes' },
        { status: 500 }
      )
  }
}

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

    const body = await request.json()
    const { title, description, ingredients, instructions, prepTime, cookTime, servings, calories } = body

    // Create recipe
    const [result] = await db.execute(
      `INSERT INTO recipes 
       (user_id, title, description, ingredients, instructions, prep_time, cook_time, servings, calories) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        decoded.userId,
        title,
        description || '',
        JSON.stringify(ingredients || []),
        instructions || '',
        prepTime || 0,
        cookTime || 0,
        servings || 1,
        calories || 0,
      ]
    ) as any

    // Update statistics
    await db.execute('UPDATE site_stats SET total_recipes = total_recipes + 1')

    return NextResponse.json({
      success: true,
      message: 'Recipe created successfully',
      recipeId: result.insertId,
    })
  } catch (error: any) {
    console.error('Recipe creation error:', error)
      return NextResponse.json(
        { success: false, message: 'Error creating recipe' },
        { status: 500 }
      )
  }
}

