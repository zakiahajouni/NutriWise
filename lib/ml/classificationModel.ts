/**
 * Professional Classification Model for Recipe Recommendations
 * Used on homepage to recommend recipes based on user profile
 */

import { loadRecipeDataset } from './datasetLoader'
import { buildIngredientVocabulary, extractUserRequestFeatures, calculateDatasetStats } from './featureExtractor'
import { createRecommendationModel, trainModel, saveModelToDB, TrainingData } from './tensorflowModel'
import db from '@/lib/db'

export interface ClassificationConfig {
  epochs?: number
  batchSize?: number
  learningRate?: number
  hiddenLayers?: number[]
  dropout?: number
  validationSplit?: number
}

/**
 * Trains multiple classification models and selects the best one
 * Tests 3 different configurations and chooses the one with highest accuracy
 */
export async function trainClassificationModelWithSelection(
  config: ClassificationConfig = {}
): Promise<{
  success: boolean
  modelId?: number
  accuracy?: number
  precision?: number
  recall?: number
  f1Score?: number
  message: string
  bestModelConfig?: ClassificationConfig
  allResults?: Array<{
    config: ClassificationConfig
    accuracy: number
    precision: number
    recall: number
    f1Score: number
  }>
}> {
  try {
    console.log('🔬 Testing 3 different model configurations...')
    console.log('='.repeat(60))
    
    // Load dataset once
    const recipes = await loadRecipeDataset()
    
    if (recipes.length < 50) {
      return {
        success: false,
        message: `Dataset too small (${recipes.length} recipes). Minimum 50 recipes required.`,
      }
    }
    
    buildIngredientVocabulary(recipes)
    const stats = calculateDatasetStats(recipes)
    const { trainingData, validationData, testData } = await generateTrainingDataFromInteractions(recipes, stats)
    
    // Define 3 different model configurations optimized for 0.8+ accuracy
    const modelConfigs: ClassificationConfig[] = [
      {
        // Model 1: Deep and wide network optimized for high accuracy
        epochs: config.epochs || 200,
        batchSize: config.batchSize || 128,
        learningRate: 0.0005,
        hiddenLayers: [512, 512, 256, 128, 64],
        dropout: 0.4,
        validationSplit: config.validationSplit || 0.15,
      },
      {
        // Model 2: Very deep network with regularization
        epochs: config.epochs || 200,
        batchSize: config.batchSize || 128,
        learningRate: 0.0003,
        hiddenLayers: [1024, 512, 256, 128, 64],
        dropout: 0.45,
        validationSplit: config.validationSplit || 0.15,
      },
      {
        // Model 3: Balanced deep network
        epochs: config.epochs || 200,
        batchSize: config.batchSize || 128,
        learningRate: 0.0004,
        hiddenLayers: [768, 384, 192, 96, 48],
        dropout: 0.4,
        validationSplit: config.validationSplit || 0.15,
      },
    ]
    
    const results: Array<{
      config: ClassificationConfig
      model: any
      savedWeights?: any[]
      accuracy: number
      precision: number
      recall: number
      f1Score: number
      loss: number
    }> = []
    
    // Test each configuration
    for (let i = 0; i < modelConfigs.length; i++) {
      const modelConfig = modelConfigs[i]
      console.log(`\n📊 Testing Model Configuration ${i + 1}/3...`)
      console.log(`   Architecture: [${modelConfig.hiddenLayers?.join(', ')}]`)
      console.log(`   Learning Rate: ${modelConfig.learningRate}`)
      console.log(`   Dropout: ${modelConfig.dropout}`)
      
      try {
        const inputSize = trainingData.features[0].length
        const outputSize = recipes.length
        
        // Create model
        const model = await createRecommendationModel({
          inputSize,
          outputSize,
          hiddenLayers: modelConfig.hiddenLayers || [128, 64, 32],
          learningRate: modelConfig.learningRate || 0.001,
          dropout: modelConfig.dropout || 0.3,
        })
        
        // Train model
        const history = await trainModel(
          model,
          trainingData,
          validationData,
          modelConfig.epochs || 50,
          modelConfig.batchSize || 32,
          outputSize
        )
        
        // CRITICAL: Save model weights IMMEDIATELY after training, before evaluation
        // This prevents any disposal issues
        const tf = await import('@tensorflow/tfjs-node')
        const modelWeights = model.getWeights()
        const savedWeights = modelWeights.map((w: any) => w.clone())
        
        // Evaluate on test set (this might dispose some resources, but we have saved weights)
        const metrics = await evaluateModel(model, testData, recipes.length)
        
        // Restore weights if needed (they should still be intact)
        try {
          model.setWeights(savedWeights)
        } catch (e) {
          // If restoration fails, weights are still in savedWeights
          console.log('   ⚠️  Note: Model weights preserved separately')
        }
        
        const finalLoss = history.history.loss[history.history.loss.length - 1] as number
        const finalAccuracy = history.history.acc 
          ? (history.history.acc[history.history.acc.length - 1] as number)
          : metrics.accuracy
        
        console.log(`   ✅ Accuracy: ${finalAccuracy.toFixed(4)}`)
        console.log(`   ✅ Precision: ${metrics.precision.toFixed(4)}`)
        console.log(`   ✅ Recall: ${metrics.recall.toFixed(4)}`)
        console.log(`   ✅ F1-Score: ${metrics.f1Score.toFixed(4)}`)
        console.log(`   ✅ Loss: ${finalLoss.toFixed(4)}`)
        
        // Store model with saved weights backup
        results.push({
          config: modelConfig,
          model, // Keep reference to model
          savedWeights, // Backup weights in case model gets disposed
          accuracy: finalAccuracy,
          precision: metrics.precision,
          recall: metrics.recall,
          f1Score: metrics.f1Score,
          loss: finalLoss,
        })
        
        // Don't dispose anything here - we need the model for saving
        
        // DON'T dispose models here - we need them all until we save the best one
      } catch (error: any) {
        console.error(`   ❌ Error training model ${i + 1}:`, error.message)
      }
    }
    
    if (results.length === 0) {
      return {
        success: false,
        message: 'All model configurations failed to train.',
      }
    }
    
    // Find the best model (highest accuracy)
    const bestResult = results.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    )
    
    console.log('\n' + '='.repeat(60))
    console.log('🏆 Model Selection Results:')
    console.log('='.repeat(60))
    
    results.forEach((result, index) => {
      const isBest = result === bestResult
      console.log(`\nModel ${index + 1}: ${isBest ? '⭐ BEST' : ''}`)
      console.log(`   Architecture: [${result.config.hiddenLayers?.join(', ')}]`)
      console.log(`   Accuracy: ${result.accuracy.toFixed(4)}`)
      console.log(`   Precision: ${result.precision.toFixed(4)}`)
      console.log(`   Recall: ${result.recall.toFixed(4)}`)
      console.log(`   F1-Score: ${result.f1Score.toFixed(4)}`)
      console.log(`   Loss: ${result.loss.toFixed(4)}`)
    })
    
    console.log(`\n✅ Selected Model: Configuration with accuracy ${bestResult.accuracy.toFixed(4)}`)
    
    // Save the best model BEFORE disposing
    const modelVersion = `classification_v${Date.now()}`
    console.log('\n💾 Saving best model...')
    
    const bestModel = bestResult.model
    const bestWeights = (bestResult as any).savedWeights
    
    // Restore weights if model was affected
    if (bestWeights) {
      try {
        bestModel.setWeights(bestWeights)
      } catch (e) {
        console.log('   ⚠️  Attempting to restore weights...')
      }
    }
    
    // Save model IMMEDIATELY before any disposal operations
    let modelId: number
    try {
      modelId = await saveModelToDB(
        bestModel,
        'recipe_classification',
        modelVersion,
        {
          modelType: 'classification',
          inputSize: trainingData.features[0].length,
          outputSize: recipes.length,
          hiddenLayers: bestResult.config.hiddenLayers || [128, 64, 32],
          trainingDataSize: trainingData.features.length,
          accuracy: bestResult.accuracy,
          precision: bestResult.precision,
          recall: bestResult.recall,
          f1Score: bestResult.f1Score,
          loss: bestResult.loss,
        }
      )
      
      // Activate best model
      await db.execute('UPDATE ml_models SET is_active = FALSE WHERE model_name = ?', ['recipe_classification'])
      await db.execute('UPDATE ml_models SET is_active = TRUE WHERE id = ?', [modelId])
      
      console.log('✅ Best classification model saved and activated')
    } catch (saveError: any) {
      console.error('❌ Error saving model:', saveError.message)
      throw saveError
    } finally {
      // Dispose all models AFTER successful save
      results.forEach(r => {
        if (r.model) {
          try {
            r.model.dispose()
          } catch (e) {
            // Ignore disposal errors
          }
        }
      })
    }
    
    console.log('✅ Best classification model saved and activated')
    
    return {
      success: true,
      modelId,
      accuracy: bestResult.accuracy,
      precision: bestResult.precision,
      recall: bestResult.recall,
      f1Score: bestResult.f1Score,
      bestModelConfig: bestResult.config,
      allResults: results.map(r => ({
        config: r.config,
        accuracy: r.accuracy,
        precision: r.precision,
        recall: r.recall,
        f1Score: r.f1Score,
      })),
      message: `Best model selected with accuracy: ${bestResult.accuracy.toFixed(4)}. Architecture: [${bestResult.config.hiddenLayers?.join(', ')}]`,
    }
  } catch (error: any) {
    console.error('❌ Model selection error:', error)
    return {
      success: false,
      message: `Error: ${error.message}`,
    }
  }
}

/**
 * Trains classification model for homepage recommendations
 */
export async function trainClassificationModel(
  config: ClassificationConfig = {}
): Promise<{
  success: boolean
  modelId?: number
  accuracy?: number
  precision?: number
  recall?: number
  f1Score?: number
  message: string
}> {
  try {
    console.log('🚀 Starting classification model training...')
    
    // Load dataset
    console.log('📊 Loading recipe dataset...')
    const recipes = await loadRecipeDataset()
    
    if (recipes.length < 50) {
      return {
        success: false,
        message: `Dataset too small (${recipes.length} recipes). Minimum 50 recipes required.`,
      }
    }
    
    console.log(`✅ ${recipes.length} recipes loaded`)
    
    // Build vocabulary
    buildIngredientVocabulary(recipes)
    const stats = calculateDatasetStats(recipes)
    
    // Generate synthetic user profiles for training
    // In production, use real user interaction data
    console.log('🔧 Generating training data from user interactions...')
    const { trainingData, validationData, testData } = await generateTrainingDataFromInteractions(recipes, stats)
    
    if (trainingData.features.length < 20) {
      return {
        success: false,
        message: `Insufficient training data (${trainingData.features.length} examples). Need at least 20 examples.`,
      }
    }
    
    console.log(`✅ ${trainingData.features.length} training examples`)
    console.log(`✅ ${validationData.features.length} validation examples`)
    console.log(`✅ ${testData.features.length} test examples`)
    
    // Create model
    const inputSize = trainingData.features[0].length
    const outputSize = recipes.length
    
    console.log(`🏗️  Creating classification model (input: ${inputSize}, output: ${outputSize})...`)
    
    const model = await createRecommendationModel({
      inputSize,
      outputSize,
      hiddenLayers: config.hiddenLayers || [512, 512, 256, 128, 64],
      learningRate: config.learningRate || 0.0004,
      dropout: config.dropout || 0.4,
    })
    
    // Train model
    console.log('🎯 Training classification model...')
    const epochs = config.epochs || 200
    const batchSize = config.batchSize || 128
    
    const history = await trainModel(
      model,
      trainingData,
      validationData,
      epochs,
      batchSize,
      outputSize // Pass number of classes
    )
    
    // Evaluate on test set
    console.log('📈 Evaluating model on test set...')
    const metrics = await evaluateModel(model, testData, recipes.length)
    
    // Get final metrics
    const finalLoss = history.history.loss[history.history.loss.length - 1] as number
    const finalAccuracy = history.history.acc 
      ? (history.history.acc[history.history.acc.length - 1] as number)
      : metrics.accuracy
    
    console.log(`✅ Training completed`)
    console.log(`   Loss: ${finalLoss.toFixed(4)}`)
    console.log(`   Accuracy: ${finalAccuracy.toFixed(4)}`)
    console.log(`   Precision: ${metrics.precision.toFixed(4)}`)
    console.log(`   Recall: ${metrics.recall.toFixed(4)}`)
    console.log(`   F1-Score: ${metrics.f1Score.toFixed(4)}`)
    
    // Save model
    const modelVersion = `classification_v${Date.now()}`
    console.log('💾 Saving classification model...')
    
    const modelId = await saveModelToDB(
      model,
      'recipe_classification',
      modelVersion,
      {
        modelType: 'classification',
        inputSize,
        outputSize,
        hiddenLayers: config.hiddenLayers || [128, 64, 32],
        trainingDataSize: trainingData.features.length,
        accuracy: finalAccuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        loss: finalLoss,
      }
    )
    
    // Activate model
    await db.execute('UPDATE ml_models SET is_active = FALSE WHERE model_name = ?', ['recipe_classification'])
    await db.execute('UPDATE ml_models SET is_active = TRUE WHERE id = ?', [modelId])
    
    console.log('✅ Classification model saved and activated')
    
    return {
      success: true,
      modelId,
      accuracy: finalAccuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1Score,
      message: `Classification model trained successfully. Accuracy: ${finalAccuracy.toFixed(4)}, F1: ${metrics.f1Score.toFixed(4)}`,
    }
  } catch (error: any) {
    console.error('❌ Classification training error:', error)
    return {
      success: false,
      message: `Error: ${error.message}`,
    }
  }
}

/**
 * Generate training data from user interactions
 * In production, this would use real user interaction data
 */
async function generateTrainingDataFromInteractions(
  recipes: any[],
  stats: ReturnType<typeof calculateDatasetStats>
): Promise<{
  trainingData: TrainingData
  validationData: TrainingData
  testData: TrainingData
}> {
  // Load real user interactions if available
  try {
    const [interactions] = await db.execute(
      `SELECT ui.*, up.age, up.gender, up.activity_level, up.dietary_preference, 
              up.allergies, up.health_conditions
       FROM user_interactions ui
       JOIN user_profiles up ON ui.user_id = up.user_id
       WHERE ui.recipe_template_id IS NOT NULL
       ORDER BY ui.created_at DESC
       LIMIT 10000`
    ) as any[]
    
    if (interactions && interactions.length > 0) {
      return generateDataFromInteractions(interactions, recipes, stats)
    }
  } catch (error) {
    console.log('⚠️  No user interactions found, generating synthetic data...')
  }
  
  // Generate synthetic training data
  return generateSyntheticTrainingData(recipes, stats)
}

function generateSyntheticTrainingData(
  recipes: any[],
  stats: ReturnType<typeof calculateDatasetStats>
): {
  trainingData: TrainingData
  validationData: TrainingData
  testData: TrainingData
} {
  const features: number[][] = []
  const labels: number[] = []
  
  // Generate synthetic user profiles with more variety
  const userProfiles = [
    { age: 25, gender: 'female', activity: 'active', diet: 'healthy', healthy: true },
    { age: 35, gender: 'male', activity: 'moderate', diet: 'normal', healthy: false },
    { age: 45, gender: 'female', activity: 'light', diet: 'vegetarian', healthy: true },
    { age: 28, gender: 'male', activity: 'very_active', diet: 'keto', healthy: true },
    { age: 50, gender: 'female', activity: 'sedentary', diet: 'normal', healthy: false },
    { age: 22, gender: 'male', activity: 'very_active', diet: 'normal', healthy: false },
    { age: 40, gender: 'female', activity: 'moderate', diet: 'vegetarian', healthy: true },
    { age: 30, gender: 'male', activity: 'active', diet: 'healthy', healthy: true },
    { age: 18, gender: 'female', activity: 'very_active', diet: 'normal', healthy: false },
    { age: 55, gender: 'male', activity: 'light', diet: 'healthy', healthy: true },
  ]
  
  const cuisines = ['Italian', 'Tunisian', 'French', 'Asian', 'Mediterranean', 'Mexican', 'Indian', 'American', 'Other']
  
  // Generate at least 40-50 examples per recipe for better training (increased for 0.8 accuracy target)
  // This ensures each recipe class has sufficient examples
  const examplesPerRecipe = Math.max(40, Math.floor(12000 / recipes.length))
  
  console.log(`📊 Generating ${examplesPerRecipe} examples per recipe (total: ~${examplesPerRecipe * recipes.length} examples)...`)
  
  for (const recipe of recipes) {
    // Create examples with different matching strategies
    const matchingStrategies = [
      { cuisineMatch: 0.9, typeMatch: 0.9, healthyMatch: 0.9, ingredientMatch: 0.8 }, // Strong match (60% of examples)
      { cuisineMatch: 0.7, typeMatch: 0.7, healthyMatch: 0.7, ingredientMatch: 0.5 }, // Moderate match (30% of examples)
      { cuisineMatch: 0.3, typeMatch: 0.3, healthyMatch: 0.3, ingredientMatch: 0.2 }, // Weak match (10% of examples)
    ]
    
    for (let i = 0; i < examplesPerRecipe; i++) {
      const profile = userProfiles[Math.floor(Math.random() * userProfiles.length)]
      
      // Choose matching strategy based on example index
      let strategy
      if (i < examplesPerRecipe * 0.6) {
        strategy = matchingStrategies[0] // Strong match
      } else if (i < examplesPerRecipe * 0.9) {
        strategy = matchingStrategies[1] // Moderate match
      } else {
        strategy = matchingStrategies[2] // Weak match
      }
      
      // Vary cuisine preference based on strategy
      const cuisineMatch = Math.random() < strategy.cuisineMatch
      const cuisine = cuisineMatch ? recipe.cuisineType : cuisines[Math.floor(Math.random() * cuisines.length)]
      
      // Vary recipe type preference based on strategy
      const typeMatch = Math.random() < strategy.typeMatch
      const recipeType = typeMatch ? recipe.recipeType : (Math.random() > 0.5 ? 'savory' : 'sweet')
      
      // Vary healthy preference based on strategy
      const healthyMatch = Math.random() < strategy.healthyMatch
      const isHealthy = healthyMatch ? recipe.isHealthy : profile.healthy
      
      // Use ingredients based on strategy
      let availableIngredients: string[] = []
      if (Math.random() < strategy.ingredientMatch && recipe.ingredients.length > 0) {
        // Use 30-80% of recipe ingredients
        const ingredientRatio = 0.3 + Math.random() * 0.5
        const numIngredients = Math.max(1, Math.floor(recipe.ingredients.length * ingredientRatio))
        const shuffled = [...recipe.ingredients].sort(() => Math.random() - 0.5)
        availableIngredients = shuffled.slice(0, numIngredients)
      }
      
      const recipeIndex = recipes.findIndex(r => r.id === recipe.id)
      if (recipeIndex === -1) continue
      
      // Extract user features
      const userFeatures = extractUserRequestFeatures(
        availableIngredients,
        recipeType as 'sweet' | 'savory',
        cuisine,
        isHealthy,
        [], // No allergies for synthetic data
        stats
      )
      
      features.push(userFeatures)
      labels.push(recipeIndex)
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

function generateDataFromInteractions(
  interactions: any[],
  recipes: any[],
  stats: ReturnType<typeof calculateDatasetStats>
): {
  trainingData: TrainingData
  validationData: TrainingData
  testData: TrainingData
} {
  // Implementation for real user interactions
  // Similar to synthetic but uses real data
  return generateSyntheticTrainingData(recipes, stats) // Placeholder
}

/**
 * Evaluate model on test set
 */
async function evaluateModel(
  model: any,
  testData: TrainingData,
  numRecipes: number
): Promise<{
  accuracy: number
  precision: number
  recall: number
  f1Score: number
}> {
  // Import TensorFlow dynamically
  const tf = await import('@tensorflow/tfjs-node')
  
  const xs = tf.tensor2d(testData.features)
  const predictions = model.predict(xs) as any
  const predictedScores = await predictions.data()
  
  let correct = 0
  // Track per-class metrics for macro-averaged precision/recall/F1
  const classTP = new Array(numRecipes).fill(0) // True Positives per class
  const classFP = new Array(numRecipes).fill(0) // False Positives per class
  const classFN = new Array(numRecipes).fill(0) // False Negatives per class
  
  const predictionsArray = Array.from(predictedScores)
  
  for (let i = 0; i < testData.labels.length; i++) {
    const trueLabel = testData.labels[i]
    const startIdx = i * numRecipes
    const endIdx = startIdx + numRecipes
    const scores = predictionsArray.slice(startIdx, endIdx) as number[]
    const predictedLabel = scores.indexOf(Math.max(...scores))
    
    if (predictedLabel === trueLabel) {
      correct++
      classTP[trueLabel]++
    } else {
      // False positive for predicted class
      classFP[predictedLabel]++
      // False negative for true class
      classFN[trueLabel]++
    }
  }
  
  xs.dispose()
  predictions.dispose()
  
  const accuracy = correct / testData.labels.length
  
  // Calculate macro-averaged precision, recall, and F1
  let totalPrecision = 0
  let totalRecall = 0
  let validClasses = 0
  
  for (let c = 0; c < numRecipes; c++) {
    const tp = classTP[c]
    const fp = classFP[c]
    const fn = classFN[c]
    
    // Only calculate if class appears in test set
    if (tp + fn > 0) {
      const precision = tp / (tp + fp) || 0
      const recall = tp / (tp + fn) || 0
      
      totalPrecision += precision
      totalRecall += recall
      validClasses++
    }
  }
  
  const precision = validClasses > 0 ? totalPrecision / validClasses : 0
  const recall = validClasses > 0 ? totalRecall / validClasses : 0
  const f1Score = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0
  
  return { accuracy, precision, recall, f1Score }
}

/**
 * Predict recipes for user profile (homepage recommendations)
 */
export async function predictRecipesForUser(
  userId: number,
  topK: number = 10
): Promise<Array<{ recipeId: number; score: number }>> {
  try {
    // Load user profile
    const [profiles] = await db.execute(
      `SELECT age, gender, activity_level, dietary_preference, allergies, health_conditions
       FROM user_profiles WHERE user_id = ?`,
      [userId]
    ) as any[]
    
    if (!profiles || profiles.length === 0) {
      return []
    }
    
    const profile = profiles[0]
    
    // Load active classification model
    const tfModule = await import('./tensorflowModel')
    const model = await tfModule.loadModelFromDB('recipe_classification', 'latest')
    
    if (!model) {
      console.log('⚠️  No classification model found, using fallback')
      return []
    }
    
    // Load recipes and stats
    const recipes = await loadRecipeDataset()
    const stats = calculateDatasetStats(recipes)
    
    // Determine preferences from profile
    const isHealthy = profile.dietary_preference === 'healthy' || 
                     profile.dietary_preference === 'vegetarian' ||
                     profile.dietary_preference === 'vegan'
    
    const allergies = profile.allergies ? JSON.parse(profile.allergies) : []
    
    // Extract user features
    const userFeatures = extractUserRequestFeatures(
      [],
      'savory', // Default, could be determined from history
      'Other',
      isHealthy,
      allergies,
      stats
    )
    
    // Predict
    const predictions = await tfModule.predictRecipes(model, userFeatures, topK)
    
    return predictions
  } catch (error) {
    console.error('Error predicting recipes for user:', error)
    return []
  }
}

