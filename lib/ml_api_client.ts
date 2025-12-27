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

export async function predictProfile(userId: number) {
  return callMLAPI('/api/ml/predict-profile', 'POST', { userId })
}

export async function suggestRecipes(userId: number, profile?: any) {
  return callMLAPI('/api/ml/suggest-recipes', 'POST', { userId, profile })
}

export async function generateMeal(request: any) {
  return callMLAPI('/api/ml/generate-meal', 'POST', request)
}

export async function trainClassification() {
  return callMLAPI('/api/ml/train-classification', 'POST')
}

export async function trainGeneration() {
  return callMLAPI('/api/ml/train-generation', 'POST')
}

