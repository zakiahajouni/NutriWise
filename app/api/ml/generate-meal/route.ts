import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import { generateRecipe, generateWithTensorFlow } from '@/lib/ml/advancedRecipeGenerator'

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
    const {
      recipeType,
      availableIngredients,
      canPurchase,
      budget,
      allergies,
      additionalInfo,
      cuisineType,
      isHealthy,
    } = body

    // Validation
    if (!recipeType || !availableIngredients || availableIngredients.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing data' },
        { status: 400 }
      )
    }

    const recipeRequest = {
      recipeType,
      availableIngredients,
      canPurchase: canPurchase || false,
      budget: budget || null,
      allergies: allergies || [],
      additionalInfo: additionalInfo || '',
      cuisineType: cuisineType || 'Other',
      isHealthy: isHealthy !== null ? isHealthy : true,
    }

    // Try to use TensorFlow.js if available (server-side only)
    let recipe
    try {
      // Dynamic import of TensorFlow.js only in this API route
      const tfModule = await import('@/lib/ml/tensorflowModel')
      const model = await tfModule.loadModelFromDB('recipe_recommendation', 'latest')
      
      if (model) {
        console.log('✅ Using TensorFlow.js model')
        recipe = await generateWithTensorFlow(model, recipeRequest, tfModule)
      } else {
        console.log('⚠️  ML model not available, using fallback system')
        recipe = await generateRecipe(recipeRequest)
      }
    } catch (tfError) {
      console.log('⚠️  TensorFlow.js error, using fallback system:', tfError)
      recipe = await generateRecipe(recipeRequest)
    }

    return NextResponse.json({
      success: true,
      recipe,
    })
  } catch (error: any) {
    console.error('Recipe generation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error generating recipe',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

