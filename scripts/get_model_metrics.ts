/**
 * Script pour récupérer et afficher les métriques des modèles entraînés
 * Usage: npm run metrics
 *    ou: npx tsx scripts/get_model_metrics.ts
 */

import db from '../lib/db'

// Note: Pour exécuter ce script, utilisez:
// npm run metrics
// ou
// npx tsx scripts/get_model_metrics.ts

interface ModelMetrics {
  id: number
  modelName: string
  modelType: string
  modelVersion: string
  trainingDataSize: number
  trainingDate: Date
  isActive: boolean
  metadata: any
  performanceMetrics: any
}

async function getModelMetrics() {
  try {
    console.log('📊 Récupération des métriques des modèles...\n')

    // Récupérer tous les modèles avec leurs métriques
    const [models] = await db.execute(`
      SELECT 
        id,
        model_name,
        model_type,
        model_version,
        training_data_size,
        training_date,
        is_active,
        model_metadata,
        performance_metrics
      FROM ml_models
      ORDER BY training_date DESC
    `) as any[]

    if (models.length === 0) {
      console.log('❌ Aucun modèle trouvé dans la base de données.')
      console.log('💡 Entraînez d\'abord un modèle avec:')
      console.log('   - API: POST /api/ml/train-classification')
      console.log('   - API: POST /api/ml/train-generation')
      console.log('   - Script: npx ts-node scripts/train_all_models.ts\n')
      return
    }

    console.log(`✅ ${models.length} modèle(s) trouvé(s)\n`)
    console.log('='.repeat(80))

    for (const model of models) {
      const metadata = model.model_metadata ? JSON.parse(model.model_metadata as any) : {}
      const performance = model.performance_metrics ? JSON.parse(model.performance_metrics as any) : {}

      console.log(`\n📦 Modèle: ${model.model_name}`)
      console.log(`   Type: ${model.model_type}`)
      console.log(`   Version: ${model.model_version}`)
      console.log(`   Date d'entraînement: ${model.training_date}`)
      console.log(`   Taille du dataset: ${model.training_data_size} exemples`)
      console.log(`   Statut: ${model.is_active ? '✅ ACTIF' : '⏸️  INACTIF'}`)

      // Métriques de classification
      if (model.model_type === 'classification') {
        console.log('\n📈 Métriques de Classification:')
        console.log('   ┌─────────────────────────────────────────────────────────┐')
        console.log('   │ Métrique          │ Valeur                              │')
        console.log('   ├─────────────────────────────────────────────────────────┤')
        
        if (metadata.accuracy !== undefined) {
          console.log(`   │ Accuracy           │ ${(metadata.accuracy * 100).toFixed(2)}%                          │`)
        }
        if (metadata.precision !== undefined) {
          console.log(`   │ Precision          │ ${(metadata.precision * 100).toFixed(2)}%                          │`)
        }
        if (metadata.recall !== undefined) {
          console.log(`   │ Recall             │ ${(metadata.recall * 100).toFixed(2)}%                          │`)
        }
        if (metadata.f1Score !== undefined) {
          console.log(`   │ F1-Score           │ ${metadata.f1Score.toFixed(4)}                          │`)
        }
        if (metadata.loss !== undefined) {
          console.log(`   │ Loss               │ ${metadata.loss.toFixed(4)}                          │`)
        }
        
        console.log('   └─────────────────────────────────────────────────────────┘')

        // Architecture
        if (metadata.hiddenLayers) {
          console.log(`\n🏗️  Architecture:`)
          console.log(`   Hidden Layers: [${metadata.hiddenLayers.join(', ')}]`)
          console.log(`   Input Size: ${metadata.inputSize}`)
          console.log(`   Output Size: ${metadata.outputSize}`)
        }
      }

      // Métriques de génération
      if (model.model_type === 'generation') {
        console.log('\n📈 Métriques de Génération:')
        console.log('   ┌─────────────────────────────────────────────────────────┐')
        console.log('   │ Métrique          │ Valeur                              │')
        console.log('   ├─────────────────────────────────────────────────────────┤')
        
        if (metadata.recipeAccuracy !== undefined) {
          console.log(`   │ Recipe Accuracy    │ ${(metadata.recipeAccuracy * 100).toFixed(2)}%                          │`)
        }
        if (metadata.ingredientF1 !== undefined) {
          console.log(`   │ Ingredient F1      │ ${metadata.ingredientF1.toFixed(4)}                          │`)
        }
        if (metadata.priceMAE !== undefined) {
          console.log(`   │ Price MAE         │ $${metadata.priceMAE.toFixed(2)}                          │`)
        }
        if (metadata.loss !== undefined) {
          console.log(`   │ Loss               │ ${metadata.loss.toFixed(4)}                          │`)
        }
        
        console.log('   └─────────────────────────────────────────────────────────┘')

        // Architecture
        if (metadata.hiddenLayers) {
          console.log(`\n🏗️  Architecture:`)
          console.log(`   Hidden Layers: [${metadata.hiddenLayers.join(', ')}]`)
          console.log(`   Input Size: ${metadata.inputSize}`)
          console.log(`   Output Size: ${metadata.outputSize}`)
        }
      }

      console.log('\n' + '='.repeat(80))
    }

    // Résumé des modèles actifs
    const activeModels = models.filter((m: any) => m.is_active)
    if (activeModels.length > 0) {
      console.log('\n✅ Modèles Actifs:')
      activeModels.forEach((model: any) => {
        console.log(`   - ${model.model_name} (${model.model_type})`)
      })
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des métriques:', error.message)
    process.exit(1)
  } finally {
    // Ne pas fermer la connexion si c'est un pool partagé
    // await db.end()
  }
}

// Exécuter le script
getModelMetrics()

