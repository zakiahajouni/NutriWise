/**
 * Professional ML Training Script
 * Trains both classification and generation models
 * Run with: npx tsx scripts/train_all_models.ts
 */

import { trainClassificationModel } from '../lib/ml/classificationModel'
import { trainGenerationModel } from '../lib/ml/generationModel'

async function trainAllModels() {
  console.log('🚀 Starting ML Model Training Pipeline')
  console.log('=' .repeat(60))
  
  try {
    // Step 1: Train Classification Model (Homepage Recommendations)
    console.log('\n📊 Step 1: Training Classification Model...')
    console.log('-'.repeat(60))
    const classificationResult = await trainClassificationModel({
      epochs: 50,
      batchSize: 32,
      learningRate: 0.001,
      hiddenLayers: [128, 64, 32],
      dropout: 0.3,
      validationSplit: 0.2,
    })
    
    if (classificationResult.success) {
      console.log('✅ Classification Model Training: SUCCESS')
      console.log(`   Accuracy: ${classificationResult.accuracy?.toFixed(4)}`)
      console.log(`   Precision: ${classificationResult.precision?.toFixed(4)}`)
      console.log(`   Recall: ${classificationResult.recall?.toFixed(4)}`)
      console.log(`   F1-Score: ${classificationResult.f1Score?.toFixed(4)}`)
    } else {
      console.log('❌ Classification Model Training: FAILED')
      console.log(`   Error: ${classificationResult.message}`)
    }
    
    // Step 2: Train Generation Model (Recipe Creation)
    console.log('\n🎨 Step 2: Training Generation Model...')
    console.log('-'.repeat(60))
    const generationResult = await trainGenerationModel({
      epochs: 100,
      batchSize: 32,
      learningRate: 0.0005,
      hiddenLayers: [256, 128, 64],
      dropout: 0.3,
      validationSplit: 0.15,
    })
    
    if (generationResult.success) {
      console.log('✅ Generation Model Training: SUCCESS')
      console.log(`   Recipe Accuracy: ${generationResult.recipeAccuracy?.toFixed(4)}`)
      console.log(`   Ingredient F1: ${generationResult.ingredientF1?.toFixed(4)}`)
      console.log(`   Price MAE: $${generationResult.priceMAE?.toFixed(2)}`)
    } else {
      console.log('❌ Generation Model Training: FAILED')
      console.log(`   Error: ${generationResult.message}`)
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 Training Summary')
    console.log('='.repeat(60))
    console.log(`Classification Model: ${classificationResult.success ? '✅ Trained' : '❌ Failed'}`)
    console.log(`Generation Model: ${generationResult.success ? '✅ Trained' : '❌ Failed'}`)
    
    if (classificationResult.success && generationResult.success) {
      console.log('\n🎉 All models trained successfully!')
      console.log('Models are now active and ready for use.')
    } else {
      console.log('\n⚠️  Some models failed to train. Check errors above.')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Fatal error during training:', error)
    process.exit(1)
  }
}

trainAllModels()

