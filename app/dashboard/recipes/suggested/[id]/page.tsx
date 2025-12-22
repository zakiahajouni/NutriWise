'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, Flame, ChefHat, UtensilsCrossed } from 'lucide-react'

interface SuggestedRecipe {
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
  type: 'sweet' | 'savory'
  matchReason: string
}

export default function SuggestedRecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [recipe, setRecipe] = useState<SuggestedRecipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to get recipe from sessionStorage first (more reliable)
    const storedRecipe = sessionStorage.getItem('suggestedRecipe')
    if (storedRecipe) {
      try {
        const parsedRecipe = JSON.parse(storedRecipe)
        setRecipe(parsedRecipe)
        setLoading(false)
        return
      } catch (e) {
        console.error('Error parsing stored recipe:', e)
      }
    }

    // Fallback: fetch from API
    const fetchSuggestion = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const res = await fetch('/api/ml/suggest-recipes', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        
        if (data.success && data.suggestions) {
          // Find the recipe by index (id is the index in the suggestions array)
          const index = parseInt(params.id as string)
          if (data.suggestions[index]) {
            setRecipe(data.suggestions[index])
          }
        }
      } catch (error) {
        console.error('Error fetching suggestion:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestion()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h2>
          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Suggestions
        </Link>

        {/* Recipe Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    recipe.type === 'sweet' 
                      ? 'bg-pink-200 text-pink-900' 
                      : 'bg-blue-200 text-blue-900'
                  }`}>
                    {recipe.type === 'sweet' ? 'Dessert' : 'Main Course'}
                  </span>
                  {recipe.isHealthy && (
                    <span className="px-3 py-1 bg-green-200 text-green-900 rounded-full text-sm font-semibold">
                      Healthy
                    </span>
                  )}
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {recipe.cuisineType}
                  </span>
                </div>
                <h1 className="text-4xl font-bold mb-3">{recipe.name}</h1>
                <p className="text-lg text-white/90">{recipe.description}</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center space-x-2">
                <Clock size={20} />
                <div>
                  <div className="text-sm opacity-90">Total Time</div>
                  <div className="font-semibold">{recipe.prepTime + recipe.cookTime} min</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ChefHat size={20} />
                <div>
                  <div className="text-sm opacity-90">Prep Time</div>
                  <div className="font-semibold">{recipe.prepTime} min</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users size={20} />
                <div>
                  <div className="text-sm opacity-90">Servings</div>
                  <div className="font-semibold">{recipe.servings}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Flame size={20} />
                <div>
                  <div className="text-sm opacity-90">Calories</div>
                  <div className="font-semibold">{recipe.calories} kcal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Match Reason */}
            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-800 font-medium">
                💡 Why this recipe is suggested for you: {recipe.matchReason}
              </p>
            </div>

            {/* Ingredients */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <UtensilsCrossed size={24} className="mr-2" />
                Ingredients
              </h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-600 mr-3">•</span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-8 border-t border-gray-200 flex space-x-4">
              <Link
                href="/dashboard/recipes/generate"
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors text-center font-medium"
              >
                Generate Personalized Variant
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

