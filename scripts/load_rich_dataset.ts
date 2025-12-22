/**
 * Script to load rich recipe dataset into database
 * Run with: npx tsx scripts/load_rich_dataset.ts
 */

import db from '../lib/db'
import { generateRichDataset } from '../lib/ml/datasetGenerator'

async function loadDataset() {
  try {
    console.log('🚀 Starting dataset loading...')
    
    const recipes = generateRichDataset()
    console.log(`📊 Generated ${recipes.length} recipes`)
    
    // Clear existing recipes (optional)
    // await db.execute('DELETE FROM recipe_templates')
    
    let inserted = 0
    let skipped = 0
    
    for (const recipe of recipes) {
      try {
        // Check if recipe already exists
        const [existing] = await db.execute(
          'SELECT id FROM recipe_templates WHERE name = ? AND cuisine_type = ?',
          [recipe.name, recipe.cuisineType]
        ) as any[]
        
        if (existing && existing.length > 0) {
          skipped++
          continue
        }
        
        // Insert recipe
        await db.execute(
          `INSERT INTO recipe_templates 
           (name, description, ingredients, steps, prep_time, cook_time, servings, 
            calories, estimated_price, cuisine_type, recipe_type, is_healthy, tags, difficulty)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            recipe.name,
            recipe.description,
            JSON.stringify(recipe.ingredients),
            JSON.stringify(recipe.steps),
            recipe.prepTime,
            recipe.cookTime,
            recipe.servings,
            recipe.calories,
            recipe.estimatedPrice,
            recipe.cuisineType,
            recipe.recipeType,
            recipe.isHealthy ? 1 : 0,
            JSON.stringify(recipe.tags),
            recipe.difficulty
          ]
        )
        
        inserted++
      } catch (error: any) {
        console.error(`Error inserting ${recipe.name}:`, error.message)
      }
    }
    
    console.log(`✅ Dataset loading complete!`)
    console.log(`   Inserted: ${inserted} recipes`)
    console.log(`   Skipped: ${skipped} recipes (already exist)`)
    
    // Get final count
    const [count] = await db.execute('SELECT COUNT(*) as total FROM recipe_templates') as any[]
    console.log(`   Total recipes in database: ${count[0].total}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error loading dataset:', error)
    process.exit(1)
  }
}

loadDataset()

