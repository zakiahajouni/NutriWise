/**
 * Script pour vérifier l'état des modèles ML dans le projet
 * Usage: npm run check:models
 *    ou: npx tsx scripts/check_models_status.ts
 */

import db from '../lib/db'

async function checkModelsStatus() {
  try {
    console.log('🔍 Vérification de l\'état des modèles ML...\n')
    console.log('='.repeat(80))

    // 1. Vérifier les modèles dans la base de données
    console.log('\n📊 1. Modèles entraînés dans la base de données:')
    console.log('─'.repeat(80))
    
    try {
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
        console.log('   ❌ Aucun modèle trouvé dans la base de données.')
        console.log('   💡 Vous devez entraîner les modèles avec: npm run train:all')
      } else {
        console.log(`   ✅ ${models.length} modèle(s) trouvé(s):\n`)
        
        for (const model of models) {
          const metadata = model.model_metadata ? JSON.parse(model.model_metadata as any) : {}
          const performance = model.performance_metrics ? JSON.parse(model.performance_metrics as any) : {}
          
          console.log(`   📦 ${model.model_name} (${model.model_type})`)
          console.log(`      Version: ${model.model_version}`)
          console.log(`      Date: ${model.training_date}`)
          console.log(`      Statut: ${model.is_active ? '✅ ACTIF' : '⏸️  INACTIF'}`)
          
          if (model.model_type === 'classification') {
            if (metadata.accuracy !== undefined) {
              console.log(`      Accuracy: ${(metadata.accuracy * 100).toFixed(2)}%`)
            }
            if (metadata.f1Score !== undefined) {
              console.log(`      F1-Score: ${metadata.f1Score.toFixed(4)}`)
            }
          } else if (model.model_type === 'generation') {
            if (metadata.recipeAccuracy !== undefined) {
              console.log(`      Recipe Accuracy: ${(metadata.recipeAccuracy * 100).toFixed(2)}%`)
            }
            if (metadata.ingredientF1 !== undefined) {
              console.log(`      Ingredient F1: ${metadata.ingredientF1.toFixed(4)}`)
            }
          }
          console.log('')
        }
      }
    } catch (error: any) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('   ❌ La table ml_models n\'existe pas.')
        console.log('   💡 Exécutez: npm run init:ml')
      } else {
        console.error('   ❌ Erreur:', error.message)
      }
    }

    // 2. Vérifier le dataset
    console.log('\n📊 2. Dataset de recettes:')
    console.log('─'.repeat(80))
    
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM recipe_templates') as any[]
      const recipeCount = rows[0]?.count || 0
      
      console.log(`   📝 Nombre de recettes: ${recipeCount}`)
      
      if (recipeCount < 50) {
        console.log(`   ⚠️  INSUFFISANT pour classification (minimum: 50)`)
      } else {
        console.log(`   ✅ Suffisant pour classification (minimum: 50)`)
      }
      
      if (recipeCount < 100) {
        console.log(`   ⚠️  INSUFFISANT pour génération (minimum: 100)`)
      } else {
        console.log(`   ✅ Suffisant pour génération (minimum: 100)`)
      }
      
      // Statistiques du dataset
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN recipe_type = 'sweet' THEN 1 ELSE 0 END) as sweet,
          SUM(CASE WHEN recipe_type = 'savory' THEN 1 ELSE 0 END) as savory,
          COUNT(DISTINCT cuisine_type) as cuisines
        FROM recipe_templates
      `) as any[]
      
      if (stats.length > 0) {
        const s = stats[0]
        console.log(`\n   📈 Statistiques:`)
        console.log(`      Sweet: ${s.sweet}, Savory: ${s.savory}`)
        console.log(`      Cuisines différentes: ${s.cuisines}`)
      }
    } catch (error: any) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('   ❌ La table recipe_templates n\'existe pas.')
        console.log('   💡 Exécutez: npm run init:ml')
      } else {
        console.error('   ❌ Erreur:', error.message)
      }
    }

    // 3. Vérifier les fichiers de code
    console.log('\n📊 3. Fichiers de code des modèles:')
    console.log('─'.repeat(80))
    
    const fs = await import('fs')
    const path = await import('path')
    
    const modelFiles = [
      'lib/ml/classificationModel.ts',
      'lib/ml/generationModel.ts',
      'lib/ml/tensorflowModel.ts',
      'lib/ml/featureExtractor.ts',
      'lib/ml/datasetLoader.ts'
    ]
    
    let filesExist = 0
    for (const file of modelFiles) {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`)
        filesExist++
      } else {
        console.log(`   ❌ ${file} (manquant)`)
      }
    }
    
    console.log(`\n   ${filesExist}/${modelFiles.length} fichiers présents`)

    // 4. Résumé
    console.log('\n' + '='.repeat(80))
    console.log('📋 RÉSUMÉ')
    console.log('='.repeat(80))
    
    try {
      const [models] = await db.execute('SELECT COUNT(*) as count FROM ml_models') as any[]
      const modelCount = models[0]?.count || 0
      
      const [recipes] = await db.execute('SELECT COUNT(*) as count FROM recipe_templates') as any[]
      const recipeCount = recipes[0]?.count || 0
      
      console.log(`\n✅ Modèles entraînés: ${modelCount}`)
      console.log(`✅ Recettes dans le dataset: ${recipeCount}`)
      console.log(`✅ Fichiers de code: ${filesExist}/${modelFiles.length}`)
      
      if (modelCount === 0) {
        console.log(`\n⚠️  Aucun modèle n'a été entraîné.`)
        if (recipeCount < 50) {
          console.log(`⚠️  Ajoutez ${50 - recipeCount} recettes minimum pour entraîner la classification.`)
        } else {
          console.log(`✅ Vous pouvez entraîner les modèles avec: npm run train:all`)
        }
      } else {
        console.log(`\n✅ Des modèles sont disponibles !`)
        console.log(`💡 Voir les métriques: npm run metrics`)
      }
      
    } catch (error: any) {
      console.log(`\n⚠️  Impossible de vérifier la base de données: ${error.message}`)
    }

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    // Ne pas fermer la connexion
  }
}

checkModelsStatus()

