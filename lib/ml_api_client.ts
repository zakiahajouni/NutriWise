/**
 * Client pour appeler l'API Python ML
 */

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000'

interface MLResponse<T> {
  success?: boolean
  error?: string
  data?: T
}

export async function callMLAPI<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: any
): Promise<T> {
  try {
    const response = await fetch(`${ML_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as T
  } catch (error: any) {
    console.error(`Error calling ML API ${endpoint}:`, error.message)
    throw error
  }
}

export interface PredictProfileResponse {
  success?: boolean
  predictedPreferences?: {
    preferredCuisines?: string[]
    preferredTypes?: string[]
  }
  recommendedRecipes?: Array<{
    id: number
    name: string
    description?: string
    cuisineType?: string
    recipeType?: string
  }>
  error?: string
}

export async function predictProfile(userId: number): Promise<PredictProfileResponse> {
  return callMLAPI<PredictProfileResponse>('/api/ml/predict-profile', 'POST', { userId })
}

export interface SuggestRecipesResponse {
  success: boolean
  suggestions: Array<{
    id: number
    name: string
    description?: string
    cuisineType?: string
    recipeType?: string
    score?: number
    matchReason?: string
  }>
  message?: string
}

export async function suggestRecipes(userId: number, profile?: any): Promise<SuggestRecipesResponse> {
  return callMLAPI<SuggestRecipesResponse>('/api/ml/suggest-recipes', 'POST', { userId, profile })
}

export interface GenerateMealResponse {
  name: string
  description?: string
  ingredients: string[]
  steps: string[]
  prepTime?: number
  cookTime?: number
  servings?: number
  calories?: number
  estimatedPrice?: number
  missingIngredients?: string[]
  cuisineType?: string
  recipeType?: string
  isHealthy?: boolean
  error?: string
}

export async function generateMeal(request: any): Promise<GenerateMealResponse> {
  return callMLAPI<GenerateMealResponse>('/api/ml/generate-meal', 'POST', request)
}

export interface TrainModelResponse {
  success: boolean
  message?: string
  modelId?: number
  metrics?: {
    accuracy?: number
    precision?: number
    recall?: number
    f1Score?: number
    loss?: number
  }
  error?: string
}

export async function trainClassification(): Promise<TrainModelResponse> {
  return callMLAPI<TrainModelResponse>('/api/ml/train-classification', 'POST')
}

export async function trainGeneration(): Promise<TrainModelResponse> {
  return callMLAPI<TrainModelResponse>('/api/ml/train-generation', 'POST')
}

