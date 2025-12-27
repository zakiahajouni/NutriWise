import { NextRequest, NextResponse } from 'next/server'
import { generateMeal } from '@/lib/ml_api_client'

export const dynamic = 'force-dynamic'

interface RecipeRequest {
  recipeType: 'sweet' | 'savory'
  availableIngredients: string[]
  canPurchase: boolean
  budget: number | null
  allergies: string[]
  additionalInfo: string
  cuisineType: string
  isHealthy: boolean
  dietaryPreference?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Préparer la requête pour l'API Python
    const recipeRequest: RecipeRequest = {
      recipeType: body.recipeType || 'savory',
      availableIngredients: body.ingredients || body.availableIngredients || [],
      canPurchase: body.canPurchase ?? false,
      budget: body.budget ?? null,
      allergies: body.allergies || [],
      additionalInfo: body.additionalInfo || '',
      cuisineType: body.cuisineType || 'Other',
      isHealthy: body.isHealthy ?? false,
      dietaryPreference: body.dietaryPreference,
    }

    try {
      // Appeler l'API Python ML
      const recipe = await generateMeal(recipeRequest)
      return NextResponse.json(recipe)
    } catch (error: any) {
      console.error('Error calling ML API:', error)
      
      // Fallback si l'API Python n'est pas disponible
      return NextResponse.json(
        { 
          error: 'ML service unavailable',
          message: 'The ML service is currently unavailable. Please try again later.',
          fallback: true
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error generating recipe:', error)
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    )
  }
}