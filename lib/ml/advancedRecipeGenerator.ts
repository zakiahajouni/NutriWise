/**
 * Advanced recipe generator using TensorFlow.js
 * Replaces the simple system with a trained ML model
 */

import { loadRecipeDatasetFiltered, RecipeTemplate } from './datasetLoader'
import { buildIngredientVocabulary, extractUserRequestFeatures, calculateDatasetStats } from './featureExtractor'
import { findMissingIngredients, estimateMissingPrice, cosineSimilarity } from './recipeGenerator'

// Import de la fonction de correspondance stricte
function normalizeIngredient(ingredient: string): string {
  return ingredient.toLowerCase().trim()
}

function ingredientsMatch(ingredient1: string, ingredient2: string): boolean {
  const norm1 = normalizeIngredient(ingredient1)
  const norm2 = normalizeIngredient(ingredient2)
  
  // Correspondance exacte
  if (norm1 === norm2) return true
  
  // Correspondance après suppression du pluriel
  const base1 = norm1.replace(/s$/, '')
  const base2 = norm2.replace(/s$/, '')
  if (base1 === base2 && base1.length > 2) return true // Éviter les correspondances trop courtes
  
  // Correspondance seulement si un est contenu dans l'autre ET que c'est significatif
  if (norm1.length >= 4 && norm2.length >= 4) {
    if (norm1.includes(norm2) && norm2.length >= norm1.length * 0.7) return true
    if (norm2.includes(norm1) && norm1.length >= norm2.length * 0.7) return true
  }
  
  return false
}

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
  suggestionNote?: string // Note informative pour les ingrédients requis
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
  
  // GESTION SPÉCIALE pour un seul ingrédient
  const isSingleIngredient = request.availableIngredients.length === 1
  let filteredRecipes = recipes
  
  if (isSingleIngredient && !request.canPurchase) {
    // Prioriser les recettes qui utilisent uniquement cet ingrédient
    const normalizedAvailable = request.availableIngredients.map(normalizeIngredient)
    filteredRecipes = recipes.filter(recipe => {
      const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
      const hasMainIngredient = normalizedRecipe.some(recipeIng => 
        normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
      )
      
      if (!hasMainIngredient) return false
      
      // Vérifier que tous les ingrédients sont disponibles (correspondance stricte)
      return normalizedRecipe.every(recipeIng => {
        return normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
      })
    })
    
    if (filteredRecipes.length > 0) {
      console.log(`✅ Found ${filteredRecipes.length} single-ingredient recipes for: ${request.availableIngredients[0]}`)
    }
  }
  
  // CRITICAL: If user cannot purchase, filter recipes STRICTLY
  if (!request.canPurchase && request.availableIngredients.length > 0 && !isSingleIngredient) {
    const normalizedAvailable = request.availableIngredients.map(normalizeIngredient)
    filteredRecipes = filteredRecipes.filter(recipe => {
      const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
      return normalizedRecipe.every(recipeIng => 
        normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
      )
    })
    
    if (filteredRecipes.length === 0) {
      console.log(`⚠️  No recipes found with available ingredients: ${request.availableIngredients.join(', ')}`)
    }
  }

  // Build vocabulary if necessary
  buildIngredientVocabulary(filteredRecipes)
  const stats = calculateDatasetStats(filteredRecipes)

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
  const predictions = await tfModule.predictRecipes(model, userFeatures, Math.min(10, filteredRecipes.length))

  // Filter recipes according to additional criteria
  let candidateRecipes = predictions
    .map((pred: { recipeId: number; score: number }) => filteredRecipes[pred.recipeId])
    .filter((recipe: RecipeTemplate | undefined) => {
      if (!recipe) return false

      // Check allergies
      const recipeIngredients = recipe.ingredients.map((i: string) => i.toLowerCase()).join(' ')
      const hasAllergen = request.allergies.some(allergy =>
        recipeIngredients.includes(allergy.toLowerCase())
      )
      if (hasAllergen) return false

      // CRITICAL: If user cannot purchase, only keep recipes with available ingredients (strict check)
      if (!request.canPurchase && request.availableIngredients.length > 0) {
        const normalizedAvailable = request.availableIngredients.map(normalizeIngredient)
        const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
        const allMatch = normalizedRecipe.every(recipeIng => 
          normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
        )
        if (!allMatch) return false // Exclude recipes with missing ingredients
      }

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
  
  // VÉRIFICATION FINALE CRITIQUE : Si l'utilisateur ne peut pas acheter, la recette NE DOIT PAS avoir d'ingrédients manquants
  if (!request.canPurchase && missingIngredients.length > 0) {
    console.error(`❌ ERREUR: Recette "${generatedRecipe.name}" retournée avec ingrédients manquants alors que canPurchase=false`)
    console.error(`   Ingrédients disponibles: ${request.availableIngredients.join(', ')}`)
    console.error(`   Ingrédients de la recette: ${generatedRecipe.ingredients.join(', ')}`)
    console.error(`   Ingrédients manquants: ${missingIngredients.join(', ')}`)
    
    // Essayer de trouver une recette qui correspond vraiment
    const normalizedAvailable = request.availableIngredients.map(normalizeIngredient)
    const matchingRecipes = filteredRecipes.filter(recipe => {
      const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
      return normalizedRecipe.every(recipeIng => 
        normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
      )
    })
    
    if (matchingRecipes.length > 0) {
      const correctRecipe = matchingRecipes[0]
      const correctMissing = findMissingIngredients(correctRecipe, request.availableIngredients)
      if (correctMissing.length === 0) {
        console.log(`✅ Correction: Recette "${correctRecipe.name}" correspond aux ingrédients disponibles`)
        return {
          ...correctRecipe,
          name: correctRecipe.name,
          description: correctRecipe.description,
          ingredients: correctRecipe.ingredients,
          steps: correctRecipe.steps,
          prepTime: correctRecipe.prepTime,
          cookTime: correctRecipe.cookTime,
          servings: correctRecipe.servings,
          calories: correctRecipe.calories,
          estimatedPrice: 0,
          cuisineType: correctRecipe.cuisineType,
          recipeType: correctRecipe.recipeType,
          isHealthy: correctRecipe.isHealthy,
          missingIngredients: [],
        }
      }
    }
    
    // Si aucune recette ne correspond, utiliser le fallback
    return await generateWithFallback(request)
  }
  
  // Ajouter une note informative si un seul ingrédient est fourni
  if (isSingleIngredient && missingIngredients.length > 0 && !request.canPurchase) {
    const mainIngredient = request.availableIngredients[0]
    generatedRecipe.suggestionNote = 
      `Pour préparer "${generatedRecipe.name}" avec seulement "${mainIngredient}", vous aurez besoin des ingrédients suivants : ${missingIngredients.join(', ')}. ` +
      `Ces ingrédients peuvent être achetés pour compléter votre recette.`
  } else if (isSingleIngredient && missingIngredients.length > 0 && request.canPurchase) {
    const mainIngredient = request.availableIngredients[0]
    generatedRecipe.suggestionNote = 
      `Recette suggérée avec "${mainIngredient}" comme ingrédient principal. ` +
      `Ingrédients supplémentaires requis : ${missingIngredients.join(', ')}.`
  }

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
      
      // GESTION SPÉCIALE pour un seul ingrédient
      const isSingleIngredient = request.availableIngredients.length === 1
      let filteredRecipes = recipes
      
      if (isSingleIngredient && !request.canPurchase) {
        // Prioriser les recettes qui utilisent uniquement cet ingrédient
        const normalizedAvailable = request.availableIngredients.map(i => i.toLowerCase().trim())
        filteredRecipes = recipes.filter(recipe => {
          const normalizedRecipe = recipe.ingredients.map(i => i.toLowerCase().trim())
          const hasMainIngredient = normalizedRecipe.some(recipeIng => 
            normalizedAvailable.some(availIng => 
              recipeIng.includes(availIng) || availIng.includes(recipeIng)
            )
          )
          
          if (!hasMainIngredient) return false
          
          // Vérifier que tous les ingrédients sont disponibles
          return normalizedRecipe.every(recipeIng => {
            return normalizedAvailable.some(availIng => {
              return recipeIng === availIng ||
                     recipeIng.includes(availIng) || 
                     availIng.includes(recipeIng) ||
                     (recipeIng.replace(/s$/, '') === availIng.replace(/s$/, ''))
            })
          })
        })
        
        if (filteredRecipes.length > 0) {
          console.log(`✅ Found ${filteredRecipes.length} single-ingredient recipes for: ${request.availableIngredients[0]}`)
        }
      }
      
      // Calculate scores for each recipe
      const scoredRecipes = filteredRecipes.map(recipe => {
        const similarity = cosineSimilarity(
          request.availableIngredients,
          recipe.ingredients
        )
        
        // Score based on similarity and criteria
        let score = similarity * 0.4
        
        // BONUS SPÉCIAL pour les recettes simples quand un seul ingrédient est fourni
        if (isSingleIngredient) {
          const ingredientCount = recipe.ingredients.length
          if (ingredientCount <= 3) {
            score += 0.3 // Bonus important pour les recettes simples
          } else if (ingredientCount <= 5) {
            score += 0.15 // Bonus modéré
          } else {
            score *= 0.7 // Pénalité pour les recettes complexes
          }
        }
        
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
      
      // Ajouter une note informative si un seul ingrédient est fourni
      if (isSingleIngredient && missingIngredients.length > 0 && !request.canPurchase) {
        const mainIngredient = request.availableIngredients[0]
        generatedRecipe.suggestionNote = 
          `Pour préparer "${generatedRecipe.name}" avec seulement "${mainIngredient}", vous aurez besoin des ingrédients suivants : ${missingIngredients.join(', ')}. ` +
          `Ces ingrédients peuvent être achetés pour compléter votre recette.`
      } else if (isSingleIngredient && missingIngredients.length > 0 && request.canPurchase) {
        const mainIngredient = request.availableIngredients[0]
        generatedRecipe.suggestionNote = 
          `Recette suggérée avec "${mainIngredient}" comme ingrédient principal. ` +
          `Ingrédients supplémentaires requis : ${missingIngredients.join(', ')}.`
      }
      
      // Adjust price if purchase authorized
      if (request.canPurchase && missingIngredients.length > 0) {
        const missingPrice = estimateMissingPrice(missingIngredients)
        generatedRecipe.estimatedPrice = missingPrice
      } else {
        // User cannot purchase - ensure no missing ingredients
        if (missingIngredients.length > 0) {
          // This shouldn't happen if filtering worked, but as safety check
          console.warn('Warning: Recipe with missing ingredients returned even though canPurchase=false')
        }
        generatedRecipe.estimatedPrice = 0
        generatedRecipe.missingIngredients = [] // Force empty if can't purchase
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

