'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit, History, User, UtensilsCrossed, Calendar, Sparkles, Brain, TrendingUp } from 'lucide-react'

interface Recipe {
  id: number
  title: string
  description: string
  prep_time: number
  cook_time: number
  servings: number
  calories: number
  created_at: string
}

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

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  age: number
  gender: string
  height: number
  weight: number
  activityLevel: string
  dietaryPreference: string
  allergies: string[]
  healthConditions: string[]
}

export default function DashboardPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [activeTab, setActiveTab] = useState<'recipes' | 'profile'>('recipes')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUserData()
    fetchRecipes()
    fetchSuggestions()
  }, [router])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/recipes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setRecipes(data.recipes)
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/ml/suggest-recipes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setRecipes(recipes.filter((r) => r.id !== id))
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome, {profile?.firstName}!
          </h1>
          <p className="text-gray-600">Manage your recipes and profile</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('recipes')}
                className={`${
                  activeTab === 'recipes'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <UtensilsCrossed size={20} />
                <span>My Recipes</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <User size={20} />
                <span>My Profile</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          <div className="space-y-8">
            {/* Recipe Suggestions Based on Profile */}
            {profile && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Suggested Recipes for You</h2>
                    <p className="text-sm text-gray-600">Based on your profile and preferences</p>
                  </div>
                </div>

                {loadingSuggestions ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="text-gray-600">Loading suggestions...</div>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Complete Your Profile
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add your dietary preferences to receive personalized suggestions
                    </p>
                    <Link
                      href="/dashboard/profile/edit"
                      className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Complete My Profile
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-primary-100"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              suggestion.type === 'sweet' 
                                ? 'bg-pink-100 text-pink-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {suggestion.type === 'sweet' ? 'Dessert' : 'Main Course'}
                            </span>
                            {suggestion.isHealthy && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                Healthy
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{suggestion.name}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {suggestion.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mb-3">
                            <span className="mr-4">{suggestion.prepTime + suggestion.cookTime} min</span>
                            <span className="mr-4">{suggestion.servings} servings</span>
                            <span>{suggestion.calories} kcal</span>
                          </div>
                          <div className="mb-3">
                            <p className="text-xs text-primary-600 font-medium flex items-center">
                              <Brain size={12} className="mr-1" />
                              {suggestion.matchReason}
                            </p>
                          </div>
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Cuisine: {suggestion.cuisineType}</p>
                            <p className="text-xs text-gray-500">Ingredients: {suggestion.ingredients.slice(0, 3).join(', ')}...</p>
                          </div>
                          <button
                            onClick={() => {
                              // Store recipe in sessionStorage and navigate
                              sessionStorage.setItem('suggestedRecipe', JSON.stringify(suggestion))
                              router.push(`/dashboard/recipes/suggested/${suggestions.indexOf(suggestion)}`)
                            }}
                            className="block w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors text-center text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recipe History */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <History className="w-6 h-6 text-gray-700" />
                  <h2 className="text-2xl font-bold text-gray-900">Recipe History</h2>
                </div>
                <Link
                  href="/dashboard/recipes/generate"
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Sparkles size={20} />
                  <span>Generate Recipe</span>
                </Link>
              </div>

            {recipes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No recipes yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Generate your first personalized recipe with AI
                </p>
                <Link
                  href="/dashboard/recipes/generate"
                  className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors flex items-center space-x-2 mx-auto w-fit"
                >
                  <Sparkles size={20} />
                  <span>Generate Recipe</span>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {recipe.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{recipe.prep_time + recipe.cook_time} min</span>
                        <span>{recipe.servings} servings</span>
                        <span>{recipe.calories} kcal</span>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/recipes/${recipe.id}`}
                          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center text-sm"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/recipes/${recipe.id}/edit`}
                          className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-center text-sm flex items-center justify-center space-x-1"
                        >
                          <Edit size={16} />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                <Link
                  href="/dashboard/profile/edit"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Edit size={20} />
                  <span>Edit</span>
                </Link>
              </div>

              {profile && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <div className="text-gray-900">{profile.firstName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <div className="text-gray-900">{profile.lastName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="text-gray-900">{profile.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <div className="text-gray-900">{profile.age} years</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <div className="text-gray-900 capitalize">
                        {profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : profile.gender || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height
                      </label>
                      <div className="text-gray-900">{profile.height} cm</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                      <div className="text-gray-900">{profile.weight} kg</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Level
                      </label>
                      <div className="text-gray-900 capitalize">{profile.activityLevel}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dietary Preference
                    </label>
                    <div className="text-gray-900 capitalize">{profile.dietaryPreference}</div>
                  </div>

                  {profile.allergies && profile.allergies.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allergies
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {profile.allergies.map((allergy, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.healthConditions && profile.healthConditions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Health Conditions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {profile.healthConditions.map((condition, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

