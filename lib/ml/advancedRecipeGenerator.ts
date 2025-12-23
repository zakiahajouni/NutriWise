/**
 * Advanced recipe generator using TensorFlow.js
 * Replaces the simple system with a trained ML model
 */

import { loadRecipeDatasetFiltered, RecipeTemplate } from './datasetLoader'
import { buildIngredientVocabulary, extractUserRequestFeatures, calculateDatasetStats } from './featureExtractor'
import { findMissingIngredients, estimateMissingPrice, cosineSimilarity } from './recipeGenerator'

// Do not import TensorFlow.js here - it will be imported dynamically only in API routes

interface RecipeRequest {
  recipeType: 'sweet' | 'savory'
  availableIngredients: string[]
  canPurchase: boolean
  budget: number | null
  allergies: string[]
  additionalInfo: string
  cuisineType: string
  isHealthy: boolean
}

interface Recipe {
  name: string
  description: string
  ingredients: string[]
  steps: string[]
  prepTime: number
  cookTime: number
  servings: number
  calories: number
  estimatedPrice: number
  missingIngredients?: string[]
  cuisineType: string
  recipeType: 'sweet' | 'savory'
  isHealthy: boolean
}

/**
 * Generates a recipe using TensorFlow.js model if available
 * Otherwise, uses the similarity-based fallback system
 * 
 * NOTE: This function does NOT load TensorFlow.js directly
 * to avoid client-side bundling issues.
 * Use generateRecipe() which will be called from API routes only.
 */
export async function generateRecipeWithML(request: RecipeRequest, useML: boolean = false): Promise<Recipe> {
  // By default, use fallback to avoid bundling issues
  // ML will be handled in API routes that can load TensorFlow.js
  if (!useML) {
    return await generateWithFallback(request)
  }
  
  // If useML is true, this means we're in an API route
  // and TensorFlow.js will be loaded dynamically there
  return await generateWithFallback(request)
}

/**
 * Generates a recipe using TensorFlow.js
 * This function is called only from API routes
 */
export async function generateWithTensorFlow(
  model: any,
  request: RecipeRequest,
  tfModule: any
): Promise<Recipe> {
  // Load filtered dataset
  const recipes = await loadRecipeDatasetFiltered({
    recipeType: request.recipeType,
    cuisineType: request.cuisineType,
    isHealthy: request.isHealthy,
  })

  if (recipes.length === 0) {
    // Fallback if no matching recipes
    return await generateWithFallback(request)
  }

  // Build vocabulary if necessary
  buildIngredientVocabulary(recipes)
  const stats = calculateDatasetStats(recipes)

  // Extract features from user request
  const userFeatures = extractUserRequestFeatures(
    request.availableIngredients,
    request.recipeType,
    request.cuisineType,
    request.isHealthy,
    request.allergies,
    stats
  )

  // Predict recommended recipes
  const predictions = await tfModule.predictRecipes(model, userFeatures, Math.min(10, recipes.length))

  // Filter recipes according to additional criteria
  let candidateRecipes = predictions
    .map((pred: { recipeId: number; score: number }) => recipes[pred.recipeId])
    .filter((recipe: RecipeTemplate | undefined) => {
      if (!recipe) return false

      // Check allergies
      const recipeIngredients = recipe.ingredients.map((i: string) => i.toLowerCase()).join(' ')
      const hasAllergen = request.allergies.some(allergy =>
        recipeIngredients.includes(allergy.toLowerCase())
      )
      if (hasAllergen) return false

      // Check budget if applicable
      if (request.canPurchase && request.budget) {
        const missing = findMissingIngredients(recipe, request.availableIngredients)
        const missingPrice = estimateMissingPrice(missing)
        if (missingPrice > request.budget) return false
      }

      return true
    })

  // If no recipe matches, use fallback
  if (candidateRecipes.length === 0) {
    return await generateWithFallback(request)
  }

  // Take the best predicted recipe
  const bestRecipe = candidateRecipes[0]

  // Create generated recipe
  const generatedRecipe: Recipe = {
    name: bestRecipe.name,
    description: bestRecipe.description,
    ingredients: bestRecipe.ingredients,
    steps: bestRecipe.steps,
    prepTime: bestRecipe.prepTime,
    cookTime: bestRecipe.cookTime,
    servings: bestRecipe.servings,
    calories: bestRecipe.calories,
    estimatedPrice: bestRecipe.estimatedPrice,
    cuisineType: bestRecipe.cuisineType,
    recipeType: bestRecipe.recipeType,
    isHealthy: bestRecipe.isHealthy,
    missingIngredients: [],
  }

  // Identify missing ingredients
  const missingIngredients = findMissingIngredients(
    generatedRecipe,
    request.availableIngredients
  )

  generatedRecipe.missingIngredients = missingIngredients

  // Adjust price if purchase authorized
  if (request.canPurchase && missingIngredients.length > 0) {
    const missingPrice = estimateMissingPrice(missingIngredients)
    generatedRecipe.estimatedPrice = missingPrice

    // If budget is exceeded, try another predicted recipe
    if (request.budget && missingPrice > request.budget) {
      for (let i = 1; i < candidateRecipes.length; i++) {
        const altRecipe = candidateRecipes[i]
        const altMissing = findMissingIngredients(altRecipe, request.availableIngredients)
        const altPrice = estimateMissingPrice(altMissing)

        if (altPrice <= request.budget) {
          return {
            ...altRecipe,
            missingIngredients: altMissing,
            estimatedPrice: altPrice,
          }
        }
      }
    }
  } else {
    // If user cannot purchase, check that they have all ingredients
    if (missingIngredients.length > 0) {
      // Look for a recipe with available ingredients
      for (let i = 1; i < candidateRecipes.length; i++) {
        const altRecipe = candidateRecipes[i]
        const altMissing = findMissingIngredients(altRecipe, request.availableIngredients)

        if (altMissing.length === 0) {
          return {
            ...altRecipe,
            missingIngredients: [],
            estimatedPrice: 0,
          }
        }
      }

      // If no recipe matches, use fallback
      return await generateWithFallback(request)
    }
  }

  return generatedRecipe
}

/**
 * Fallback system using cosine similarity (old system)
 * Tries to load from DB first, otherwise uses static templates
 */
async function generateWithFallback(request: RecipeRequest): Promise<Recipe> {
  try {
    // Try to load from DB first
    const recipes = await loadRecipeDatasetFiltered({
      recipeType: request.recipeType,
      cuisineType: request.cuisineType,
      isHealthy: request.isHealthy,
    })
    
    if (recipes.length > 0) {
      // Use recipes from DB
      buildIngredientVocabulary(recipes)
      const stats = calculateDatasetStats(recipes)
      
      // Calculate scores for each recipe
      const scoredRecipes = recipes.map(recipe => {
        const similarity = cosineSimilarity(
          request.availableIngredients,
          recipe.ingredients
        )
        
        // Score based on similarity and criteria
        let score = similarity * 0.4
        
        // Bonus for matching cuisine type
        if (recipe.cuisineType.toLowerCase() === request.cuisineType.toLowerCase()) {
          score += 0.3
        }
        
        // Bonus for health preference
        if (recipe.isHealthy === request.isHealthy) {
          score += 0.2
        }
        
        // Check allergies
        const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase()).join(' ')
        const hasAllergen = request.allergies.some(allergy =>
          recipeIngredients.includes(allergy.toLowerCase())
        )
        if (hasAllergen) score -= 0.5
        
        return { recipe, score }
      })
      
      // Sort by score
      scoredRecipes.sort((a, b) => b.score - a.score)
      
      // Take the best recipe
      const bestRecipe = scoredRecipes[0]?.recipe || recipes[0]
      
      // Create generated recipe
      const generatedRecipe: Recipe = {
        name: bestRecipe.name,
        description: bestRecipe.description,
        ingredients: bestRecipe.ingredients,
        steps: bestRecipe.steps,
        prepTime: bestRecipe.prepTime,
        cookTime: bestRecipe.cookTime,
        servings: bestRecipe.servings,
        calories: bestRecipe.calories,
        estimatedPrice: bestRecipe.estimatedPrice,
        cuisineType: bestRecipe.cuisineType,
        recipeType: bestRecipe.recipeType,
        isHealthy: bestRecipe.isHealthy,
        missingIngredients: [],
      }
      
      // Identify missing ingredients
      const missingIngredients = findMissingIngredients(
        generatedRecipe,
        request.availableIngredients
      )
      
      generatedRecipe.missingIngredients = missingIngredients
      
      // Adjust price if purchase authorized
      if (request.canPurchase && missingIngredients.length > 0) {
        const missingPrice = estimateMissingPrice(missingIngredients)
        generatedRecipe.estimatedPrice = missingPrice
      } else {
        generatedRecipe.estimatedPrice = 0
      }
      
      return generatedRecipe
    }
  } catch (error) {
    console.error('Error loading from DB:', error)
  }
  
  // Fallback to static templates (now loads from DB)
  const { generateRecipe } = await import('./recipeGenerator')
  return await generateRecipe(request)
}

/**
 * Main generation function (used by API)
 * Uses fallback by default to avoid bundling issues
 */
export async function generateRecipe(request: RecipeRequest): Promise<Recipe> {
  return await generateRecipeWithML(request, false)
}

