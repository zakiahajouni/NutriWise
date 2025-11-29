/**
 * Feature extraction for ML model
 * Converts raw data into numerical vectors for TensorFlow
 */

import { RecipeTemplate } from './datasetLoader'

export interface FeatureVector {
  ingredients: number[] // One-hot encoding or embedding of ingredients
  recipeType: number // 0 for sweet, 1 for savory
  cuisineType: number // Cuisine type encoding
  isHealthy: number // 0 or 1
  calories: number // Normalized
  price: number // Normalized
  prepTime: number // Normalized
  cookTime: number // Normalized
}

// Ingredient vocabulary (will be built dynamically from dataset)
let ingredientVocabulary: Map<string, number> = new Map()
let cuisineTypes: Map<string, number> = new Map()

/**
 * Builds ingredient vocabulary from dataset
 */
export function buildIngredientVocabulary(recipes: RecipeTemplate[]): void {
  const ingredientSet = new Set<string>()
  
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      ingredientSet.add(ing.toLowerCase().trim())
    })
  })

  ingredientVocabulary = new Map()
  Array.from(ingredientSet).sort().forEach((ing, index) => {
    ingredientVocabulary.set(ing, index)
  })

  // Also build cuisine type vocabulary
  const cuisineSet = new Set<string>()
  recipes.forEach(recipe => {
    cuisineSet.add(recipe.cuisineType.toLowerCase())
  })

  cuisineTypes = new Map()
  Array.from(cuisineSet).sort().forEach((cuisine, index) => {
    cuisineTypes.set(cuisine, index)
  })
}

/**
 * Normalizes a value between 0 and 1
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return (value - min) / (max - min)
}

/**
 * Extracts features from a recipe
 */
export function extractRecipeFeatures(
  recipe: RecipeTemplate,
  stats?: {
    minCalories: number
    maxCalories: number
    minPrice: number
    maxPrice: number
    minPrepTime: number
    maxPrepTime: number
    minCookTime: number
    maxCookTime: number
  }
): number[] {
  const vocabSize = ingredientVocabulary.size || 100 // Default size
  const features: number[] = []

  // One-hot encoding of ingredients
  const ingredientVector = new Array(vocabSize).fill(0)
  recipe.ingredients.forEach(ing => {
    const index = ingredientVocabulary.get(ing.toLowerCase().trim())
    if (index !== undefined) {
      ingredientVector[index] = 1
    }
  })
  features.push(...ingredientVector)

  // Recipe type (one-hot)
  features.push(recipe.recipeType === 'sweet' ? 0 : 1)

  // Cuisine type (one-hot)
  const cuisineVector = new Array(cuisineTypes.size || 10).fill(0)
  const cuisineIndex = cuisineTypes.get(recipe.cuisineType.toLowerCase())
  if (cuisineIndex !== undefined) {
    cuisineVector[cuisineIndex] = 1
  }
  features.push(...cuisineVector)

  // Normalized numerical features
  if (stats) {
    features.push(normalize(recipe.calories, stats.minCalories, stats.maxCalories))
    features.push(normalize(recipe.estimatedPrice, stats.minPrice, stats.maxPrice))
    features.push(normalize(recipe.prepTime, stats.minPrepTime, stats.maxPrepTime))
    features.push(normalize(recipe.cookTime, stats.minCookTime, stats.maxCookTime))
  } else {
    // Default values if no stats
    features.push(recipe.calories / 1000) // Approximation
    features.push(recipe.estimatedPrice / 50) // Approximation
    features.push(recipe.prepTime / 120) // Approximation
    features.push(recipe.cookTime / 180) // Approximation
  }

  // Is healthy (0 or 1)
  features.push(recipe.isHealthy ? 1 : 0)

  return features
}

/**
 * Extracts features from a user request
 */
export function extractUserRequestFeatures(
  availableIngredients: string[],
  recipeType: 'sweet' | 'savory',
  cuisineType: string,
  isHealthy: boolean,
  allergies: string[] = [],
  stats?: {
    minCalories: number
    maxCalories: number
    minPrice: number
    maxPrice: number
    minPrepTime: number
    maxPrepTime: number
    minCookTime: number
    maxCookTime: number
  }
): number[] {
  const vocabSize = ingredientVocabulary.size || 100
  const features: number[] = []

  // Encoding of available ingredients
  const ingredientVector = new Array(vocabSize).fill(0)
  availableIngredients.forEach(ing => {
    const index = ingredientVocabulary.get(ing.toLowerCase().trim())
    if (index !== undefined) {
      ingredientVector[index] = 1
    }
  })
  features.push(...ingredientVector)

  // Recipe type
  features.push(recipeType === 'sweet' ? 0 : 1)

  // Cuisine type
  const cuisineVector = new Array(cuisineTypes.size || 10).fill(0)
  const cuisineIndex = cuisineTypes.get(cuisineType.toLowerCase())
  if (cuisineIndex !== undefined) {
    cuisineVector[cuisineIndex] = 1
  }
  features.push(...cuisineVector)

  // Numerical features (averages by default)
  if (stats) {
    const avgCalories = (stats.minCalories + stats.maxCalories) / 2
    const avgPrice = (stats.minPrice + stats.maxPrice) / 2
    const avgPrepTime = (stats.minPrepTime + stats.maxPrepTime) / 2
    const avgCookTime = (stats.minCookTime + stats.maxCookTime) / 2
    
    features.push(normalize(avgCalories, stats.minCalories, stats.maxCalories))
    features.push(normalize(avgPrice, stats.minPrice, stats.maxPrice))
    features.push(normalize(avgPrepTime, stats.minPrepTime, stats.maxPrepTime))
    features.push(normalize(avgCookTime, stats.minCookTime, stats.maxCookTime))
  } else {
    features.push(0.5, 0.5, 0.5, 0.5) // Default values
  }

  // Is healthy
  features.push(isHealthy ? 1 : 0)

  // Encoding of allergies (penalty)
  const allergyVector = new Array(vocabSize).fill(0)
  allergies.forEach(allergy => {
    const index = ingredientVocabulary.get(allergy.toLowerCase().trim())
    if (index !== undefined) {
      allergyVector[index] = -1 // Penalty for allergens
    }
  })
  features.push(...allergyVector)

  return features
}

/**
 * Calculates dataset statistics
 */
export function calculateDatasetStats(recipes: RecipeTemplate[]): {
  minCalories: number
  maxCalories: number
  minPrice: number
  maxPrice: number
  minPrepTime: number
  maxPrepTime: number
  minCookTime: number
  maxCookTime: number
} {
  if (recipes.length === 0) {
    return {
      minCalories: 0,
      maxCalories: 1000,
      minPrice: 0,
      maxPrice: 50,
      minPrepTime: 0,
      maxPrepTime: 120,
      minCookTime: 0,
      maxCookTime: 180,
    }
  }

  const calories = recipes.map(r => r.calories)
  const prices = recipes.map(r => r.estimatedPrice)
  const prepTimes = recipes.map(r => r.prepTime)
  const cookTimes = recipes.map(r => r.cookTime)

  return {
    minCalories: Math.min(...calories),
    maxCalories: Math.max(...calories),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    minPrepTime: Math.min(...prepTimes),
    maxPrepTime: Math.max(...prepTimes),
    minCookTime: Math.min(...cookTimes),
    maxCookTime: Math.max(...cookTimes),
  }
}

