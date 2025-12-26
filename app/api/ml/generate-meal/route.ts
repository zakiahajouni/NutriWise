import { NextRequest, NextResponse } from 'next/server'

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

    // ✅ 1. Objet source clairement défini avec tous les champs requis
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

    const { generateRecipe } = await import('@/lib/ml/recipeGenerator')

    try {
      const recipe = await generateRecipe(recipeRequest)
      return NextResponse.json(recipe)
    } catch (error) {
      // ✅ 2. Fallback propre et sûr
      const fallbackRequest: RecipeRequest = {
        ...recipeRequest,
        cuisineType: 'Other',
        isHealthy: false,
        dietaryPreference: undefined,
      }

      const fallbackRecipe = await generateRecipe(fallbackRequest)
      return NextResponse.json(fallbackRecipe)
    }
  } catch (error) {
    console.error('Error generating recipe:', error)
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    )
  }
}