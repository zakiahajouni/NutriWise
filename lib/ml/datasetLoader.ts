/**
 * Dynamic dataset loader from database
 * Allows loading a huge dataset of recipes from MySQL
 * Falls back to JSON file if database is empty
 */

import db from '@/lib/db'
import fs from 'fs'
import path from 'path'
import { generateRichDataset } from './datasetGenerator'

export interface RecipeTemplate {
  id: number
  name: string
  description: string
  ingredients: string[]
  steps: string[]
  prepTime: number
  cookTime: number
  servings: number
  calories: number
  estimatedPrice: number
  cuisineType: string
  recipeType: 'sweet' | 'savory'
  isHealthy: boolean
  tags?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
}

/**
 * Loads all recipes from the database
 * Falls back to JSON file if database is empty
 */
export async function loadRecipeDataset(): Promise<RecipeTemplate[]> {
  try {
    const [rows] = await db.execute(
      `SELECT id, name, description, ingredients, steps, prep_time, cook_time, 
       servings, calories, estimated_price, cuisine_type, recipe_type, is_healthy, tags, difficulty
       FROM recipe_templates`
    ) as any[]

    // Si la base de données est vide, charger depuis le fichier JSON
    if (!rows || rows.length === 0) {
      console.log('⚠️  Base de données vide, chargement depuis le fichier JSON...')
      return await loadFromJSONFile()
    }

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      ingredients: JSON.parse(row.ingredients || '[]'),
      steps: JSON.parse(row.steps || '[]'),
      prepTime: row.prep_time || 0,
      cookTime: row.cook_time || 0,
      servings: row.servings || 1,
      calories: row.calories || 0,
      estimatedPrice: parseFloat(row.estimated_price) || 0,
      cuisineType: row.cuisine_type || 'Other',
      recipeType: row.recipe_type,
      isHealthy: Boolean(row.is_healthy),
      tags: row.tags ? JSON.parse(row.tags) : [],
      difficulty: row.difficulty || 'medium',
    }))
  } catch (error) {
    console.error('Error loading dataset from database:', error)
    console.log('⚠️  Tentative de chargement depuis le fichier JSON...')
    return await loadFromJSONFile()
  }
}

/**
 * Loads recipes from JSON file as fallback
 */
async function loadFromJSONFile(): Promise<RecipeTemplate[]> {
  try {
    const recipes = generateRichDataset()
    
    if (recipes.length === 0) {
      console.error('❌ Aucune recette trouvée dans le fichier JSON')
      return []
    }

    console.log(`✅ ${recipes.length} recettes chargées depuis le fichier JSON`)
    
    // Convertir le format du JSON vers RecipeTemplate
    return recipes.map((recipe, index) => ({
      id: recipe.id || index + 1,
      name: recipe.name,
      description: recipe.description || '',
      ingredients: recipe.ingredients || [],
      steps: recipe.steps || [],
      prepTime: recipe.prepTime || 0,
      cookTime: recipe.cookTime || 0,
      servings: recipe.servings || 4,
      calories: recipe.calories || 0,
      estimatedPrice: recipe.estimatedPrice || 0,
      cuisineType: recipe.cuisine || 'Other',
      recipeType: recipe.recipeType,
      isHealthy: recipe.isHealthy || false,
      tags: recipe.tags || [],
      difficulty: recipe.difficulty || 'medium',
    }))
  } catch (error) {
    console.error('❌ Erreur lors du chargement depuis le fichier JSON:', error)
    return []
  }
}

/**
 * Loads recipes with filters
 */
export async function loadRecipeDatasetFiltered(filters: {
  recipeType?: 'sweet' | 'savory'
  cuisineType?: string
  isHealthy?: boolean
  maxCalories?: number
  minCalories?: number
}): Promise<RecipeTemplate[]> {
  try {
    let query = `SELECT id, name, description, ingredients, steps, prep_time, cook_time, 
       servings, calories, estimated_price, cuisine_type, recipe_type, is_healthy, tags, difficulty
       FROM recipe_templates WHERE 1=1`
    
    const params: any[] = []

    if (filters.recipeType) {
      query += ' AND recipe_type = ?'
      params.push(filters.recipeType)
    }

    if (filters.cuisineType) {
      query += ' AND cuisine_type = ?'
      params.push(filters.cuisineType)
    }

    if (filters.isHealthy !== undefined) {
      query += ' AND is_healthy = ?'
      params.push(filters.isHealthy ? 1 : 0)
    }

    if (filters.maxCalories) {
      query += ' AND calories <= ?'
      params.push(filters.maxCalories)
    }

    if (filters.minCalories) {
      query += ' AND calories >= ?'
      params.push(filters.minCalories)
    }

    const [rows] = await db.execute(query, params) as any[]

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      ingredients: JSON.parse(row.ingredients || '[]'),
      steps: JSON.parse(row.steps || '[]'),
      prepTime: row.prep_time || 0,
      cookTime: row.cook_time || 0,
      servings: row.servings || 1,
      calories: row.calories || 0,
      estimatedPrice: parseFloat(row.estimated_price) || 0,
      cuisineType: row.cuisine_type || 'Other',
      recipeType: row.recipe_type,
      isHealthy: Boolean(row.is_healthy),
      tags: row.tags ? JSON.parse(row.tags) : [],
      difficulty: row.difficulty || 'medium',
    }))
  } catch (error) {
    console.error('Error loading filtered dataset:', error)
    return []
  }
}

/**
 * Adds a new recipe to the dataset
 */
export async function addRecipeToDataset(recipe: Omit<RecipeTemplate, 'id'>): Promise<number> {
  try {
    const [result] = await db.execute(
      `INSERT INTO recipe_templates 
       (name, description, ingredients, steps, prep_time, cook_time, servings, calories, 
        estimated_price, cuisine_type, recipe_type, is_healthy, tags, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipe.name,
        recipe.description || '',
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
        JSON.stringify(recipe.tags || []),
        recipe.difficulty || 'medium',
      ]
    ) as any

    return result.insertId
  } catch (error) {
    console.error('Error adding recipe:', error)
    throw error
  }
}

/**
 * Gets the total number of recipes in the dataset
 */
export async function getDatasetSize(): Promise<number> {
  try {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM recipe_templates'
    ) as any[]

    return rows[0]?.count || 0
  } catch (error) {
    console.error('Error counting dataset:', error)
    return 0
  }
}

/**
 * Loads user interactions for training
 */
export async function loadUserInteractions(userId?: number): Promise<any[]> {
  try {
    let query = `SELECT ui.*, rt.recipe_type, rt.cuisine_type, rt.is_healthy
                 FROM user_interactions ui
                 LEFT JOIN recipe_templates rt ON ui.recipe_template_id = rt.id
                 WHERE 1=1`
    
    const params: any[] = []

    if (userId) {
      query += ' AND ui.user_id = ?'
      params.push(userId)
    }

    query += ' ORDER BY ui.created_at DESC LIMIT 10000' // Limit to avoid overload

    const [rows] = await db.execute(query, params) as any[]
    return rows
  } catch (error) {
    console.error('Error loading interactions:', error)
    return []
  }
}

