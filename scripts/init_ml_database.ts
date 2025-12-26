/**
 * Script pour initialiser la base de données ML
 * Crée les tables nécessaires et insère des recettes de base
 * Usage: npm run init:ml
 *    ou: npx tsx scripts/init_ml_database.ts
 */

import fs from 'fs'
import path from 'path'
import db from '../lib/db'

async function initMLDatabase() {
  try {
    console.log('🚀 Initialisation de la base de données ML...\n')

    // Lire le fichier SQL
    const sqlPath = path.join(process.cwd(), 'database', 'ml_schema.sql')
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Fichier SQL non trouvé: ${sqlPath}`)
      process.exit(1)
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')
    
    // Nettoyer le contenu SQL : supprimer les commentaires sur une ligne
    let cleanedSQL = sqlContent
      .split('\n')
      .map(line => {
        // Supprimer les commentaires en fin de ligne (-- commentaire)
        const commentIndex = line.indexOf('--')
        if (commentIndex !== -1) {
          return line.substring(0, commentIndex).trim()
        }
        return line.trim()
      })
      .filter(line => {
        // Garder les lignes non vides et qui ne sont pas des commentaires complets
        return line.length > 0 && !line.startsWith('--')
      })
      .join(' ')

    // Diviser le SQL en requêtes individuelles (séparées par ;)
    // Normaliser les espaces multiples
    cleanedSQL = cleanedSQL.replace(/\s+/g, ' ')
    
    const queries = cleanedSQL
      .split(';')
      .map(q => q.trim())
      .filter(q => {
        // Filtrer les lignes vides et les requêtes USE (on est déjà dans la bonne DB)
        return q.length > 0 && 
               !q.toUpperCase().startsWith('USE') &&
               !q.match(/^\s*$/) &&
               q.length > 10 // Ignorer les fragments trop courts
      })

    console.log(`📊 Exécution de ${queries.length} requêtes SQL...\n`)
    
    // Debug: afficher les premières requêtes pour vérifier
    if (queries.length === 0) {
      console.error('❌ Aucune requête SQL trouvée dans le fichier!')
      console.error('Contenu nettoyé (premiers 500 caractères):')
      console.error(cleanedSQL.substring(0, 500))
      process.exit(1)
    }

    // Exécuter chaque requête
    let tablesCreated = 0
    let dataInserted = false

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      
      // Ignorer les requêtes USE (on est déjà dans la bonne base)
      if (query.toUpperCase().trim().startsWith('USE')) {
        continue
      }

      try {
        await db.execute(query)
        
        if (query.toUpperCase().includes('CREATE TABLE')) {
          const tableMatch = query.match(/CREATE TABLE.*?IF NOT EXISTS\s+`?(\w+)`?/i) || 
                           query.match(/CREATE TABLE\s+`?(\w+)`?/i)
          const tableName = tableMatch?.[1]
          if (tableName) {
            console.log(`   ✅ Table créée: ${tableName}`)
            tablesCreated++
          }
        } else if (query.toUpperCase().includes('INSERT INTO')) {
          if (!dataInserted) {
            console.log(`   ✅ Données insérées dans recipe_templates`)
            dataInserted = true
          }
        }
      } catch (error: any) {
        // Ignorer les erreurs "table already exists" ou "duplicate entry"
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_ENTRY' ||
            error.message?.includes('already exists')) {
          // Table existe déjà, c'est OK
          if (query.toUpperCase().includes('CREATE TABLE')) {
            const tableMatch = query.match(/CREATE TABLE.*?IF NOT EXISTS\s+`?(\w+)`?/i) || 
                             query.match(/CREATE TABLE\s+`?(\w+)`?/i)
            const tableName = tableMatch?.[1]
            if (tableName) {
              console.log(`   ⚠️  Table existe déjà: ${tableName}`)
            }
          }
        } else {
          console.error(`   ❌ Erreur sur la requête ${i + 1}:`, error.message)
          console.error(`   Requête: ${query.substring(0, 100)}...`)
          // Continuer même en cas d'erreur pour voir toutes les erreurs
        }
      }
    }

    console.log(`\n✅ ${tablesCreated} table(s) créée(s)`)

    // Vérifier le nombre de recettes
    let recipeCount = 0
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM recipe_templates') as any[]
      recipeCount = rows[0]?.count || 0
    } catch (error: any) {
      // Si la table n'existe toujours pas, c'est qu'il y a eu une erreur
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.error(`\n❌ La table recipe_templates n'a pas pu être créée.`)
        console.error(`   Vérifiez les erreurs ci-dessus.`)
        process.exit(1)
      }
    }

    console.log(`\n✅ Initialisation terminée !`)
    console.log(`📊 Nombre de recettes dans le dataset: ${recipeCount}`)

    if (recipeCount < 50) {
      console.log(`\n⚠️  ATTENTION: Le dataset contient seulement ${recipeCount} recettes.`)
      console.log(`   Minimum recommandé: 50 pour classification, 100 pour génération.`)
      console.log(`   Vous pouvez ajouter plus de recettes via:`)
      console.log(`   - Le script scripts/load_rich_dataset.ts`)
      console.log(`   - L'API POST /api/recipes`)
      console.log(`   - Directement dans MySQL`)
    } else {
      console.log(`\n✅ Dataset suffisant pour l'entraînement !`)
    }

    console.log(`\n💡 Prochaines étapes:`)
    console.log(`   1. Entraîner les modèles: npm run train:all`)
    console.log(`   2. Voir les métriques: npm run metrics`)

  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    // Ne pas fermer la connexion si c'est un pool partagé
    // await db.end()
  }
}

initMLDatabase()

