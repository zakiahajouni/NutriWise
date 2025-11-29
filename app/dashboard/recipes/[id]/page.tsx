'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Clock, Users, Flame, Edit } from 'lucide-react'

interface Recipe {
  id: number
  title: string
  description: string
  ingredients: string[]
  instructions: string
  prep_time: number
  cook_time: number
  servings: number
  calories: number
  created_at: string
}

export default function RecipeDetailPage() {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const res = await fetch(`/api/recipes/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()
        if (data.success) {
          setRecipe(data.recipe)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error fetching recipe:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchRecipe()
    }
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!recipe) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="text-primary-600 hover:text-primary-700 mb-4 inline-block"
        >
          ← Back to dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-4xl font-bold text-gray-900">{recipe.title}</h1>
            <Link
              href={`/dashboard/recipes/${recipe.id}/edit`}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Edit size={20} />
              <span>Edit</span>
            </Link>
          </div>

          {recipe.description && (
            <p className="text-gray-600 text-lg mb-6">{recipe.description}</p>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock size={20} />
              <span>{recipe.prep_time + recipe.cook_time} min</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Users size={20} />
              <span>{recipe.servings} servings</span>
            </div>
            {recipe.calories > 0 && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Flame size={20} />
                <span>{recipe.calories} kcal</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{recipe.instructions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

