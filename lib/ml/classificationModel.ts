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
      hiddenLayers: config.hiddenLayers || [128, 64, 32],
      learningRate: config.learningRate || 0.001,
      dropout: config.dropout || 0.3,
    })
    
    // Train model
    console.log('🎯 Training classification model...')
    const epochs = config.epochs || 50
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
  
  // Generate synthetic user profiles
  const userProfiles = [
    { age: 25, gender: 'female', activity: 'active', diet: 'healthy', healthy: true },
    { age: 35, gender: 'male', activity: 'moderate', diet: 'normal', healthy: false },
    { age: 45, gender: 'female', activity: 'light', diet: 'vegetarian', healthy: true },
    { age: 28, gender: 'male', activity: 'very_active', diet: 'keto', healthy: true },
    { age: 50, gender: 'female', activity: 'sedentary', diet: 'normal', healthy: false },
  ]
  
  const cuisines = ['Italian', 'Tunisian', 'French', 'Asian', 'Mediterranean', 'Mexican', 'Indian', 'American']
  
  for (let i = 0; i < 200; i++) {
    const profile = userProfiles[Math.floor(Math.random() * userProfiles.length)]
    const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)]
    const recipeType = Math.random() > 0.5 ? 'savory' : 'sweet'
    
    // Find matching recipe
    const matchingRecipes = recipes.filter(r => 
      r.cuisineType === cuisine && 
      r.recipeType === recipeType &&
      r.isHealthy === profile.healthy
    )
    
    if (matchingRecipes.length === 0) continue
    
    const selectedRecipe = matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)]
    const recipeIndex = recipes.findIndex(r => r.id === selectedRecipe.id)
    
    if (recipeIndex === -1) continue
    
    // Extract user features
    const userFeatures = extractUserRequestFeatures(
      [], // No specific ingredients for classification
      recipeType as 'sweet' | 'savory',
      cuisine,
      profile.healthy,
      [], // No allergies for synthetic data
      stats
    )
    
    features.push(userFeatures)
    labels.push(recipeIndex)
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
  let truePositives = 0
  let falsePositives = 0
  let falseNegatives = 0
  
  const predictionsArray = Array.from(predictedScores)
  
  for (let i = 0; i < testData.labels.length; i++) {
    const trueLabel = testData.labels[i]
    const startIdx = i * numRecipes
    const endIdx = startIdx + numRecipes
    const scores = predictionsArray.slice(startIdx, endIdx)
    const predictedLabel = scores.indexOf(Math.max(...scores))
    
    if (predictedLabel === trueLabel) {
      correct++
      truePositives++
    } else {
      falsePositives++
      falseNegatives++
    }
  }
  
  xs.dispose()
  predictions.dispose()
  
  const accuracy = correct / testData.labels.length
  const precision = truePositives / (truePositives + falsePositives) || 0
  const recall = truePositives / (truePositives + falseNegatives) || 0
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0
  
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

