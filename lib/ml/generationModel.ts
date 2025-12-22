/**
 * Professional Generation Model for Recipe Creation
 * Generates personalized recipes based on available ingredients and preferences
 */

import { loadRecipeDatasetFiltered } from './datasetLoader'
import { buildIngredientVocabulary, extractUserRequestFeatures, calculateDatasetStats } from './featureExtractor'
import { createRecommendationModel, trainModel, saveModelToDB, TrainingData } from './tensorflowModel'
import { findMissingIngredients, estimateMissingPrice } from './recipeGenerator'
import db from '@/lib/db'

export interface GenerationConfig {
  epochs?: number
  batchSize?: number
  learningRate?: number
  hiddenLayers?: number[]
  dropout?: number
  validationSplit?: number
}

/**
 * Trains generation model for recipe creation
 * Multi-task learning: recipe selection + missing ingredients + price estimation
 */
export async function trainGenerationModel(
  config: GenerationConfig = {}
): Promise<{
  success: boolean
  modelId?: number
  recipeAccuracy?: number
  ingredientF1?: number
  priceMAE?: number
  message: string
}> {
  try {
    console.log('🚀 Starting generation model training...')
    
    // Load dataset
    console.log('📊 Loading recipe dataset...')
    const recipes = await loadRecipeDataset()
    
    if (recipes.length < 100) {
      return {
        success: false,
        message: `Dataset too small (${recipes.length} recipes). Minimum 100 recipes required for generation.`,
      }
    }
    
    console.log(`✅ ${recipes.length} recipes loaded`)
    
    // Build vocabulary
    buildIngredientVocabulary(recipes)
    const stats = calculateDatasetStats(recipes)
    
    // Generate training data from recipe-ingredient combinations
    console.log('🔧 Generating training data...')
    const { trainingData, validationData, testData } = await generateTrainingDataForGeneration(recipes, stats)
    
    if (trainingData.features.length < 50) {
      return {
        success: false,
        message: `Insufficient training data (${trainingData.features.length} examples). Need at least 50 examples.`,
      }
    }
    
    console.log(`✅ ${trainingData.features.length} training examples`)
    console.log(`✅ ${validationData.features.length} validation examples`)
    console.log(`✅ ${testData.features.length} test examples`)
    
    // Create multi-task model
    const inputSize = trainingData.features[0].length
    const outputSize = recipes.length
    
    console.log(`🏗️  Creating generation model (input: ${inputSize}, output: ${outputSize})...`)
    
    // For now, use single-task model (recipe selection)
    // Multi-task can be added later
    const model = await createRecommendationModel({
      inputSize,
      outputSize,
      hiddenLayers: config.hiddenLayers || [256, 128, 64],
      learningRate: config.learningRate || 0.0005,
      dropout: config.dropout || 0.3,
    })
    
    // Train model
    console.log('🎯 Training generation model...')
    const epochs = config.epochs || 100
    const batchSize = config.batchSize || 32
    
    const history = await trainModel(
      model,
      trainingData,
      validationData,
      epochs,
      batchSize
    )
    
    // Evaluate on test set
    console.log('📈 Evaluating model on test set...')
    const metrics = await evaluateGenerationModel(model, testData, recipes, stats)
    
    // Get final metrics
    const finalLoss = history.history.loss[history.history.loss.length - 1] as number
    const finalAccuracy = history.history.acc 
      ? (history.history.acc[history.history.acc.length - 1] as number)
      : metrics.recipeAccuracy
    
    console.log(`✅ Training completed`)
    console.log(`   Loss: ${finalLoss.toFixed(4)}`)
    console.log(`   Recipe Accuracy: ${metrics.recipeAccuracy.toFixed(4)}`)
    console.log(`   Ingredient F1: ${metrics.ingredientF1.toFixed(4)}`)
    console.log(`   Price MAE: $${metrics.priceMAE.toFixed(2)}`)
    
    // Save model
    const modelVersion = `generation_v${Date.now()}`
    console.log('💾 Saving generation model...')
    
    const modelId = await saveModelToDB(
      model,
      'recipe_generation',
      modelVersion,
      {
        modelType: 'generation',
        inputSize,
        outputSize,
        hiddenLayers: config.hiddenLayers || [256, 128, 64],
        trainingDataSize: trainingData.features.length,
        recipeAccuracy: metrics.recipeAccuracy,
        ingredientF1: metrics.ingredientF1,
        priceMAE: metrics.priceMAE,
        loss: finalLoss,
      }
    )
    
    // Activate model
    await db.execute('UPDATE ml_models SET is_active = FALSE WHERE model_name = ?', ['recipe_generation'])
    await db.execute('UPDATE ml_models SET is_active = TRUE WHERE id = ?', [modelId])
    
    console.log('✅ Generation model saved and activated')
    
    return {
      success: true,
      modelId,
      recipeAccuracy: metrics.recipeAccuracy,
      ingredientF1: metrics.ingredientF1,
      priceMAE: metrics.priceMAE,
      message: `Generation model trained successfully. Recipe Accuracy: ${metrics.recipeAccuracy.toFixed(4)}, Ingredient F1: ${metrics.ingredientF1.toFixed(4)}`,
    }
  } catch (error: any) {
    console.error('❌ Generation training error:', error)
    return {
      success: false,
      message: `Error: ${error.message}`,
    }
  }
}

/**
 * Generate training data for recipe generation
 * Creates examples with partial ingredient lists
 */
async function generateTrainingDataForGeneration(
  recipes: any[],
  stats: ReturnType<typeof calculateDatasetStats>
): Promise<{
  trainingData: TrainingData
  validationData: TrainingData
  testData: TrainingData
}> {
  const features: number[][] = []
  const labels: number[] = []
  
  // For each recipe, create multiple training examples with different ingredient subsets
  for (const recipe of recipes) {
    // Create 3-5 examples per recipe with different available ingredient combinations
    const numExamples = 3 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < numExamples; i++) {
      // Randomly select 40-80% of ingredients as "available"
      const availableRatio = 0.4 + Math.random() * 0.4
      const numAvailable = Math.max(1, Math.floor(recipe.ingredients.length * availableRatio))
      
      // Randomly select available ingredients
      const shuffled = [...recipe.ingredients].sort(() => Math.random() - 0.5)
      const availableIngredients = shuffled.slice(0, numAvailable)
      
      // Extract features
      const userFeatures = extractUserRequestFeatures(
        availableIngredients,
        recipe.recipeType,
        recipe.cuisineType,
        recipe.isHealthy,
        [], // No allergies for training
        stats
      )
      
      features.push(userFeatures)
      
      // Label is the recipe index
      const recipeIndex = recipes.findIndex(r => r.id === recipe.id)
      labels.push(recipeIndex >= 0 ? recipeIndex : 0)
    }
  }
  
  // Shuffle
  const shuffled = features.map((f, i) => ({ feature: f, label: labels[i] }))
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  // Split: 70% train, 15% validation, 15% test
  const trainEnd = Math.floor(shuffled.length * 0.7)
  const valEnd = trainEnd + Math.floor(shuffled.length * 0.15)
  
  return {
    trainingData: {
      features: shuffled.slice(0, trainEnd).map(s => s.feature),
      labels: shuffled.slice(0, trainEnd).map(s => s.label),
    },
    validationData: {
      features: shuffled.slice(trainEnd, valEnd).map(s => s.feature),
      labels: shuffled.slice(trainEnd, valEnd).map(s => s.label),
    },
    testData: {
      features: shuffled.slice(valEnd).map(s => s.feature),
      labels: shuffled.slice(valEnd).map(s => s.label),
    },
  }
}

/**
 * Evaluate generation model
 */
async function evaluateGenerationModel(
  model: any,
  testData: TrainingData,
  recipes: any[],
  stats: ReturnType<typeof calculateDatasetStats>
): Promise<{
  recipeAccuracy: number
  ingredientF1: number
  priceMAE: number
}> {
  const tf = await import('@tensorflow/tfjs-node')
  
  const xs = tf.tensor2d(testData.features)
  const predictions = model.predict(xs) as any
  const predictedScores = await predictions.data()
  
  let correctRecipes = 0
  let totalIngredientMatches = 0
  let totalIngredientPredictions = 0
  let totalIngredientActuals = 0
  let totalPriceError = 0
  
  const predictionsArray = Array.from(predictedScores)
  const numRecipes = recipes.length
  
  for (let i = 0; i < testData.labels.length; i++) {
    const trueRecipeIndex = testData.labels[i]
    const trueRecipe = recipes[trueRecipeIndex]
    
    if (!trueRecipe) continue
    
    // Get predicted recipe
    const startIdx = i * numRecipes
    const endIdx = startIdx + numRecipes
    const scores = predictionsArray.slice(startIdx, endIdx)
    const predictedRecipeIndex = scores.indexOf(Math.max(...scores))
    const predictedRecipe = recipes[predictedRecipeIndex]
    
    // Recipe accuracy
    if (predictedRecipeIndex === trueRecipeIndex) {
      correctRecipes++
    }
    
    // Ingredient prediction (simplified - would need actual ingredient prediction model)
    // For now, use missing ingredients from true recipe
    if (predictedRecipe) {
      const missing = findMissingIngredients(predictedRecipe, trueRecipe.ingredients)
      totalIngredientMatches += trueRecipe.ingredients.length - missing.length
      totalIngredientPredictions += predictedRecipe.ingredients.length
      totalIngredientActuals += trueRecipe.ingredients.length
      
      // Price error
      const predictedPrice = predictedRecipe.estimatedPrice
      const actualPrice = trueRecipe.estimatedPrice
      totalPriceError += Math.abs(predictedPrice - actualPrice)
    }
  }
  
  xs.dispose()
  predictions.dispose()
  
  const recipeAccuracy = correctRecipes / testData.labels.length
  const ingredientPrecision = totalIngredientMatches / totalIngredientPredictions || 0
  const ingredientRecall = totalIngredientMatches / totalIngredientActuals || 0
  const ingredientF1 = 2 * (ingredientPrecision * ingredientRecall) / (ingredientPrecision + ingredientRecall) || 0
  const priceMAE = totalPriceError / testData.labels.length
  
  return { recipeAccuracy, ingredientF1, priceMAE }
}

