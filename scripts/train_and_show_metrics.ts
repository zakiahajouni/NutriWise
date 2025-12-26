/**
 * Script pour entraîner les modèles et afficher les métriques en temps réel
 * Usage: npm run train:all
 *    ou: npm run train:classification
 *    ou: npm run train:generation
 *    ou: npx tsx scripts/train_and_show_metrics.ts [classification|generation|both]
 */

import { trainClassificationModel } from '../lib/ml/classificationModel'
import { trainGenerationModel } from '../lib/ml/generationModel'

async function trainAndShowMetrics(modelType: 'classification' | 'generation' | 'both' = 'both') {
  console.log('🚀 Démarrage de l\'entraînement des modèles...\n')
  console.log('='.repeat(80))

  const results: any = {}

  // Entraîner le modèle de classification
  if (modelType === 'classification' || modelType === 'both') {
    console.log('\n📊 Entraînement du modèle de CLASSIFICATION...')
    console.log('─'.repeat(80))
    
    try {
      const result = await trainClassificationModel({
        epochs: 50,
        batchSize: 32,
        learningRate: 0.001,
        hiddenLayers: [128, 64, 32],
        dropout: 0.3,
      })

      if (result.success) {
        results.classification = result
        console.log('\n✅ Modèle de classification entraîné avec succès!')
        console.log('\n📈 Métriques Finales:')
        console.log('   ┌─────────────────────────────────────────────────────────┐')
        console.log('   │ Métrique          │ Valeur                              │')
        console.log('   ├─────────────────────────────────────────────────────────┤')
        console.log(`   │ Accuracy          │ ${(result.accuracy! * 100).toFixed(2)}%                          │`)
        console.log(`   │ Precision         │ ${(result.precision! * 100).toFixed(2)}%                          │`)
        console.log(`   │ Recall            │ ${(result.recall! * 100).toFixed(2)}%                          │`)
        console.log(`   │ F1-Score          │ ${result.f1Score!.toFixed(4)}                          │`)
        console.log('   └─────────────────────────────────────────────────────────┘')
        console.log(`\n💾 Modèle sauvegardé avec ID: ${result.modelId}`)
      } else {
        console.error(`❌ Erreur: ${result.message}`)
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de l'entraînement de classification:`, error.message)
    }
  }

  // Entraîner le modèle de génération
  if (modelType === 'generation' || modelType === 'both') {
    console.log('\n\n📊 Entraînement du modèle de GÉNÉRATION...')
    console.log('─'.repeat(80))
    
    try {
      const result = await trainGenerationModel({
        epochs: 100,
        batchSize: 32,
        learningRate: 0.0005,
        hiddenLayers: [256, 128, 64],
        dropout: 0.3,
      })

      if (result.success) {
        results.generation = result
        console.log('\n✅ Modèle de génération entraîné avec succès!')
        console.log('\n📈 Métriques Finales:')
        console.log('   ┌─────────────────────────────────────────────────────────┐')
        console.log('   │ Métrique          │ Valeur                              │')
        console.log('   ├─────────────────────────────────────────────────────────┤')
        console.log(`   │ Recipe Accuracy   │ ${(result.recipeAccuracy! * 100).toFixed(2)}%                          │`)
        console.log(`   │ Ingredient F1     │ ${result.ingredientF1!.toFixed(4)}                          │`)
        console.log(`   │ Price MAE         │ $${result.priceMAE!.toFixed(2)}                          │`)
        console.log('   └─────────────────────────────────────────────────────────┘')
        console.log(`\n💾 Modèle sauvegardé avec ID: ${result.modelId}`)
      } else {
        console.error(`❌ Erreur: ${result.message}`)
      }
    } catch (error: any) {
      console.error(`❌ Erreur lors de l'entraînement de génération:`, error.message)
    }
  }

  // Résumé final
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 RÉSUMÉ DES RÉSULTATS')
  console.log('='.repeat(80))

  if (results.classification) {
    console.log('\n✅ Classification Model:')
    console.log(`   Accuracy: ${(results.classification.accuracy! * 100).toFixed(2)}%`)
    console.log(`   Precision: ${(results.classification.precision! * 100).toFixed(2)}%`)
    console.log(`   Recall: ${(results.classification.recall! * 100).toFixed(2)}%`)
    console.log(`   F1-Score: ${results.classification.f1Score!.toFixed(4)}`)
  }

  if (results.generation) {
    console.log('\n✅ Generation Model:')
    console.log(`   Recipe Accuracy: ${(results.generation.recipeAccuracy! * 100).toFixed(2)}%`)
    console.log(`   Ingredient F1: ${results.generation.ingredientF1!.toFixed(4)}`)
    console.log(`   Price MAE: $${results.generation.priceMAE!.toFixed(2)}`)
  }

  console.log('\n💡 Pour voir toutes les métriques sauvegardées:')
  console.log('   npx ts-node scripts/get_model_metrics.ts\n')

  process.exit(0)
}

// Récupérer l'argument de ligne de commande
const modelType = process.argv[2] as 'classification' | 'generation' | 'both' || 'both'
trainAndShowMetrics(modelType)

