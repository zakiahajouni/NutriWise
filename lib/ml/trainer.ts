/**
 * Complete training system for ML model
 * Manages training, validation and model saving
 */

import { loadRecipeDataset, RecipeTemplate } from './datasetLoader'
import { buildIngredientVocabulary, extractRecipeFeatures, calculateDatasetStats } from './featureExtractor'
import { createRecommendationModel, trainModel, saveModelToDB, TrainingData } from './tensorflowModel'
import db from '@/lib/db'

export interface TrainingConfig {
  epochs?: number
  batchSize?: number
  learningRate?: number
  hiddenLayers?: number[]
  dropout?: number
  validationSplit?: number
}

/**
 * Prépare les données d'entraînement depuis le dataset
 */
async function prepareTrainingData(
  recipes: RecipeTemplate[],
  stats: ReturnType<typeof calculateDatasetStats>
): Promise<{ trainingData: TrainingData; validationData: TrainingData }> {
  // Build vocabulary
  buildIngredientVocabulary(recipes)

  // Extract features
  const features = recipes.map(recipe => extractRecipeFeatures(recipe, stats))
  const labels = recipes.map((_, index) => index)

  // Shuffle data
  const shuffled = features.map((f, i) => ({ feature: f, label: labels[i] }))
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Split into training and validation
  const validationSplit = 0.2
  const splitIndex = Math.floor(shuffled.length * (1 - validationSplit))

  const trainingFeatures = shuffled.slice(0, splitIndex).map(s => s.feature)
  const trainingLabels = shuffled.slice(0, splitIndex).map(s => s.label)

  const validationFeatures = shuffled.slice(splitIndex).map(s => s.feature)
  const validationLabels = shuffled.slice(splitIndex).map(s => s.label)

  return {
    trainingData: {
      features: trainingFeatures,
      labels: trainingLabels,
    },
    validationData: {
      features: validationFeatures,
      labels: validationLabels,
    },
  }
}

/**
 * Trains the recommendation model
 */
export async function trainRecommendationModel(
  config: TrainingConfig = {}
): Promise<{
  success: boolean
  modelId?: number
  accuracy?: number
  loss?: number
  message: string
}> {
  try {
    console.log('🚀 Starting ML model training...')

    // Load dataset
    console.log('📊 Loading dataset...')
    const recipes = await loadRecipeDataset()
    
    if (recipes.length < 10) {
      return {
        success: false,
        message: `Dataset too small (${recipes.length} recipes). Minimum 10 recipes required.`,
      }
    }

    console.log(`✅ ${recipes.length} recipes loaded`)

    // Calculate statistics
    const stats = calculateDatasetStats(recipes)

    // Prepare data
    console.log('🔧 Preparing training data...')
    const { trainingData, validationData } = await prepareTrainingData(recipes, stats)

    console.log(`✅ ${trainingData.features.length} training examples`)
    console.log(`✅ ${validationData.features.length} validation examples`)

    // Create model
    const inputSize = trainingData.features[0].length
    const outputSize = recipes.length

    console.log(`🏗️  Creating model (input: ${inputSize}, output: ${outputSize})...`)

    const model = await createRecommendationModel({
      inputSize,
      outputSize,
      hiddenLayers: config.hiddenLayers || [128, 64, 32],
      learningRate: config.learningRate || 0.001,
      dropout: config.dropout || 0.2,
    })

    // Train model
    console.log('🎯 Training model...')
    const epochs = config.epochs || 50
    const batchSize = config.batchSize || 32

    const history = await trainModel(
      model,
      trainingData,
      validationData,
      epochs,
      batchSize,
      outputSize // Pass number of classes
    )

    // Get final metrics
    const finalLoss = history.history.loss[history.history.loss.length - 1] as number
    const finalAccuracy = history.history.acc 
      ? (history.history.acc[history.history.acc.length - 1] as number)
      : 0
    const finalValLoss = history.history.valLoss
      ? (history.history.valLoss[history.history.valLoss.length - 1] as number)
      : undefined
    const finalValAccuracy = history.history.valAcc
      ? (history.history.valAcc[history.history.valAcc.length - 1] as number)
      : undefined

    console.log(`✅ Training completed`)
    console.log(`   Loss: ${finalLoss.toFixed(4)}`)
    console.log(`   Accuracy: ${finalAccuracy.toFixed(4)}`)
    if (finalValLoss) console.log(`   Val Loss: ${finalValLoss.toFixed(4)}`)
    if (finalValAccuracy) console.log(`   Val Accuracy: ${finalValAccuracy.toFixed(4)}`)

    // Save model
    const modelVersion = `v${Date.now()}`
    console.log('💾 Saving model...')

    await saveModelToDB(model, 'recipe_recommendation', modelVersion, {
      accuracy: finalAccuracy,
      loss: finalLoss,
      valAccuracy: finalValAccuracy,
      valLoss: finalValLoss,
      trainingDataSize: trainingData.features.length,
      validationDataSize: validationData.features.length,
      epochs,
      batchSize,
      inputSize,
      outputSize,
      hiddenLayers: config.hiddenLayers || [128, 64, 32],
    })

    // Sauvegarder l'historique d'entraînement
    const [result] = await db.execute(
      'SELECT id FROM ml_models WHERE model_name = ? AND model_version = ?',
      ['recipe_recommendation', modelVersion]
    ) as any[]

    const modelId = result[0]?.id

    if (modelId) {
      // Sauvegarder chaque epoch
      for (let i = 0; i < history.history.loss.length; i++) {
        await db.execute(
          `INSERT INTO training_history 
           (model_id, epoch, loss, accuracy, validation_loss, validation_accuracy)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            modelId,
            i + 1,
            history.history.loss[i],
            history.history.acc ? history.history.acc[i] : null,
            history.history.valLoss ? history.history.valLoss[i] : null,
            history.history.valAcc ? history.history.valAcc[i] : null,
          ]
        )
      }
    }

    console.log('✅ Model saved successfully')

    return {
      success: true,
      modelId,
      accuracy: finalValAccuracy || finalAccuracy,
      loss: finalValLoss || finalLoss,
      message: `Model trained successfully. Accuracy: ${(finalValAccuracy || finalAccuracy).toFixed(4)}`,
    }
  } catch (error: any) {
    console.error('❌ Training error:', error)
    return {
      success: false,
      message: `Error: ${error.message}`,
    }
  }
}

/**
 * Activates a specific model (deactivates others)
 */
export async function activateModel(modelId: number): Promise<boolean> {
  try {
    await db.execute('UPDATE ml_models SET is_active = FALSE')
    await db.execute('UPDATE ml_models SET is_active = TRUE WHERE id = ?', [modelId])
    return true
  } catch (error) {
    console.error('Error activating model:', error)
    return false
  }
}

