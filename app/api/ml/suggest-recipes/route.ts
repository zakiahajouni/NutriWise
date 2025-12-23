import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken, verifyToken } from '@/lib/auth'
import db from '@/lib/db'
import { generateRecipe } from '@/lib/ml/recipeGenerator'

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

    // Get user profile
    const [profiles] = await db.execute(
      `SELECT age, gender, dietary_preference, allergies, health_conditions, activity_level
       FROM user_profiles WHERE user_id = ?`,
      [decoded.userId]
    ) as any[]

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'No profile found. Please complete your profile to get personalized suggestions.'
      })
    }

    const profile = profiles[0]
    const allergies = profile.allergies ? JSON.parse(profile.allergies) : []
    const dietaryPreference = profile.dietary_preference || 'normal'
    
    // Determine if user prefers healthy recipes
    const isHealthy = dietaryPreference === 'healthy' || 
                     dietaryPreference === 'vegetarian' ||
                     dietaryPreference === 'vegan'

    // Generate suggestions for both sweet and savory recipes
    const suggestions = []
    const usedRecipeNames = new Set<string>()
    
    // Generate 2 savory suggestions (try to get different ones)
    for (let i = 0; i < 2; i++) {
      let attempts = 0
      let savoryRecipe
      
      do {
        const savoryRequest = {
          recipeType: 'savory' as const,
          availableIngredients: [], // Empty - we want full recipe suggestions
          canPurchase: true,
          budget: null,
          allergies: allergies,
          additionalInfo: i === 1 ? 'different recipe' : '', // Hint for variety
          cuisineType: 'Other', // Let ML decide
          isHealthy: isHealthy,
          dietaryPreference: dietaryPreference // CRITICAL: Pass dietary preference
        }
        
        savoryRecipe = await generateRecipe(savoryRequest)
        attempts++
        
        // If we've tried 5 times and still get duplicates, break
        if (attempts >= 5) break
      } while (usedRecipeNames.has(savoryRecipe.name) && attempts < 5)
      
      if (savoryRecipe && !usedRecipeNames.has(savoryRecipe.name)) {
        usedRecipeNames.add(savoryRecipe.name)
        suggestions.push({
          ...savoryRecipe,
          type: 'savory',
          matchReason: getMatchReason(profile, savoryRecipe)
        })
      }
    }

    // Generate 1 sweet suggestion
    const sweetRequest = {
      recipeType: 'sweet' as const,
      availableIngredients: [],
      canPurchase: true,
      budget: null,
      allergies: allergies,
      additionalInfo: '',
      cuisineType: 'Other',
      isHealthy: isHealthy,
      dietaryPreference: dietaryPreference // CRITICAL: Pass dietary preference
    }
    
    const sweetRecipe = await generateRecipe(sweetRequest)
    if (!usedRecipeNames.has(sweetRecipe.name)) {
      suggestions.push({
        ...sweetRecipe,
        type: 'sweet',
        matchReason: getMatchReason(profile, sweetRecipe)
      })
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions
    })
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

