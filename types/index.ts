// Types pour l'application NutriWise

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  createdAt: string
}

export interface UserProfile {
  id: number
  userId: number
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  height: number | null
  weight: number | null
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  dietaryPreference: 'healthy' | 'normal' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | null
  allergies: string[]
  healthConditions: string[]
}

export interface Recipe {
  id: number
  userId: number
  title: string
  description: string
  ingredients: string[]
  instructions: string
  prepTime: number
  cookTime: number
  servings: number
  calories: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface SiteStats {
  totalUsers: number
  totalRecipes: number
  totalMealsPlanned: number
}

