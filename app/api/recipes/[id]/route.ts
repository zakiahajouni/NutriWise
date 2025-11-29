import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthToken, verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token invalide' },
        { status: 401 }
      )
    }

    const [recipes] = await db.execute(
      `SELECT id, title, description, ingredients, instructions, prep_time, cook_time, servings, calories, created_at 
       FROM recipes WHERE id = ? AND user_id = ?`,
      [params.id, decoded.userId]
    ) as any[]

    if (!recipes || recipes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Recipe not found' },
        { status: 404 }
      )
    }

    const recipe = recipes[0]
    return NextResponse.json({
      success: true,
      recipe: {
        ...recipe,
        ingredients: JSON.parse(recipe.ingredients),
      },
    })
  } catch (error: any) {
    console.error('Recipe fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Error fetching recipe' },
        { status: 500 }
      )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token invalide' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, ingredients, instructions, prepTime, cookTime, servings, calories } = body

    // Verify recipe belongs to user
    const [recipes] = await db.execute(
      'SELECT id FROM recipes WHERE id = ? AND user_id = ?',
      [params.id, decoded.userId]
    ) as any[]

    if (!recipes || recipes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Recipe not found' },
        { status: 404 }
      )
    }

    // Update recipe
    await db.execute(
      `UPDATE recipes 
       SET title = ?, description = ?, ingredients = ?, instructions = ?, 
           prep_time = ?, cook_time = ?, servings = ?, calories = ?
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description || '',
        JSON.stringify(ingredients || []),
        instructions || '',
        prepTime || 0,
        cookTime || 0,
        servings || 1,
        calories || 0,
        params.id,
        decoded.userId,
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Recipe updated successfully',
    })
  } catch (error: any) {
    console.error('Recipe update error:', error)
      return NextResponse.json(
        { success: false, message: 'Error updating recipe' },
        { status: 500 }
      )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token invalide' },
        { status: 401 }
      )
    }

    await db.execute('DELETE FROM recipes WHERE id = ? AND user_id = ?', [
      params.id,
      decoded.userId,
    ])

    return NextResponse.json({
      success: true,
      message: 'Recipe deleted successfully',
    })
  } catch (error: any) {
    console.error('Recipe deletion error:', error)
      return NextResponse.json(
        { success: false, message: 'Error deleting recipe' },
        { status: 500 }
      )
  }
}

