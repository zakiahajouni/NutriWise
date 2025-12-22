/**
 * Professional Dataset Generator for ML Training
 * Loads recipes from JSON file instead of separate functions
 */

import fs from 'fs'
import path from 'path'

export interface RecipeData {
  id: number
  name: string
  description: string
  cuisine: string
  recipeType: 'sweet' | 'savory'
  isHealthy: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: string[]
  steps: string[]
  prepTime: number
  cookTime: number
  servings: number
  calories: number
  estimatedPrice: number
  tags: string[]
}

/**
 * Load recipes from JSON file
 */
export function generateRichDataset(): RecipeData[] {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'recipes_dataset.json')
    const fileContent = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    return data.recipes || []
  } catch (error) {
    console.error('Error loading recipes from JSON:', error)
    return []
  }
}

/**
 * Get recipes by cuisine
 */
export function getRecipesByCuisine(cuisine: string): RecipeData[] {
  const allRecipes = generateRichDataset()
  return allRecipes.filter(recipe => 
    recipe.cuisine.toLowerCase() === cuisine.toLowerCase()
  )
}

/**
 * Get recipes by type (sweet/savory)
 */
export function getRecipesByType(recipeType: 'sweet' | 'savory'): RecipeData[] {
  const allRecipes = generateRichDataset()
  return allRecipes.filter(recipe => recipe.recipeType === recipeType)
}

/**
 * Get all unique cuisines
 */
export function getAllCuisines(): string[] {
  const allRecipes = generateRichDataset()
  const cuisines = new Set(allRecipes.map(recipe => recipe.cuisine))
  return Array.from(cuisines).sort()
}

/**
 * Get recipe statistics
 */
export function getDatasetStats(): {
  total: number
  byCuisine: Record<string, number>
  byType: { sweet: number; savory: number }
  byDifficulty: Record<string, number>
  byHealth: { healthy: number; unhealthy: number }
} {
  const allRecipes = generateRichDataset()
  
  const stats = {
    total: allRecipes.length,
    byCuisine: {} as Record<string, number>,
    byType: { sweet: 0, savory: 0 },
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byHealth: { healthy: 0, unhealthy: 0 }
  }
  
  allRecipes.forEach(recipe => {
    // Count by cuisine
    stats.byCuisine[recipe.cuisine] = (stats.byCuisine[recipe.cuisine] || 0) + 1
    
    // Count by type
    stats.byType[recipe.recipeType]++
    
    // Count by difficulty
    stats.byDifficulty[recipe.difficulty] = (stats.byDifficulty[recipe.difficulty] || 0) + 1
    
    // Count by health
    if (recipe.isHealthy) {
      stats.byHealth.healthy++
    } else {
      stats.byHealth.unhealthy++
    }
  })
  
  return stats
}
