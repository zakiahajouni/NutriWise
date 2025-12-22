'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Utensils, ShoppingCart, DollarSign, AlertTriangle, Info, Sparkles } from 'lucide-react'

interface FormData {
  // Step 1: Recipe type
  recipeType: 'sweet' | 'savory' | ''
  
  // Step 2: Available ingredients
  availableIngredients: string[]
  
  // Step 3: Purchase decision
  canPurchase: boolean | null
  
  // Step 4: Budget (if canPurchase is true)
  budget: string
  
  // Step 5: Allergies (pre-filled from profile, editable)
  allergies: string[]
  
  // Step 6: Additional info
  additionalInfo: string
  
  // Step 7: Cuisine type and health preference
  cuisineType: string
  isHealthy: boolean | null
}

const ALLERGIES_OPTIONS = [
  'Peanuts', 'Shellfish', 'Milk', 'Eggs', 'Soy',
  'Gluten', 'Lactose', 'Tree Nuts', 'Wheat', 'Fish'
]

const CUISINE_TYPES = [
  'Italian', 'Tunisian', 'French', 'Asian', 'Mediterranean',
  'Mexican', 'Indian', 'American', 'Middle Eastern', 'Other'
]

export default function GenerateRecipePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    recipeType: '',
    availableIngredients: [''],
    canPurchase: null,
    budget: '',
    allergies: [],
    additionalInfo: '',
    cuisineType: '',
    isHealthy: null,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null)
  const router = useRouter()

  // Load user profile allergies on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()
        if (data.success && data.profile.allergies) {
          setFormData(prev => ({
            ...prev,
            allergies: data.profile.allergies || []
          }))
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    loadProfile()
  }, [router])

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      availableIngredients: [...prev.availableIngredients, '']
    }))
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availableIngredients: prev.availableIngredients.filter((_, i) => i !== index)
    }))
  }

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.availableIngredients]
      updated[index] = value
      return { ...prev, availableIngredients: updated }
    })
  }

  const toggleAllergy = (allergy: string) => {
    setFormData(prev => {
      const current = prev.allergies
      const updated = current.includes(allergy)
        ? current.filter(item => item !== allergy)
        : [...current, allergy]
      return { ...prev, allergies: updated }
    })
  }

  const validateStep = (step: number): boolean => {
    setError('')
    
    switch (step) {
      case 1:
        if (!formData.recipeType) {
          setError('Please select a recipe type')
          return false
        }
        return true
      
      case 2:
        const validIngredients = formData.availableIngredients.filter(i => i.trim())
        if (validIngredients.length === 0) {
          setError('Please add at least one available ingredient')
          return false
        }
        return true
      
      case 3:
        if (formData.canPurchase === null) {
          setError('Please make a choice')
          return false
        }
        return true
      
      case 4:
        if (formData.canPurchase && (!formData.budget || parseFloat(formData.budget) <= 0)) {
          setError('Please enter a valid budget')
          return false
        }
        return true
      
      case 5:
        // Allergies are optional
        return true
      
      case 6:
        // Additional info is optional
        return true
      
      case 7:
        if (!formData.cuisineType || formData.isHealthy === null) {
          setError('Please fill in all fields')
          return false
        }
        return true
      
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Skip budget step if user doesn't want to purchase
      if (currentStep === 3 && !formData.canPurchase) {
        setCurrentStep(5) // Skip to allergies
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, 7))
      }
    }
  }

  const handlePrevious = () => {
    // Skip budget step when going back if user doesn't want to purchase
    if (currentStep === 5 && !formData.canPurchase) {
      setCurrentStep(3)
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1))
    }
  }

  const handleGenerate = async () => {
    if (!validateStep(7)) return

    setGenerating(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/ml/generate-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipeType: formData.recipeType,
          availableIngredients: formData.availableIngredients.filter(i => i.trim()),
          canPurchase: formData.canPurchase,
          budget: formData.canPurchase ? parseFloat(formData.budget) : null,
          allergies: formData.allergies,
          additionalInfo: formData.additionalInfo,
          cuisineType: formData.cuisineType,
          isHealthy: formData.isHealthy,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setGeneratedRecipe(data.recipe)
      } else {
        setError(data.message || 'Error generating recipe')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveRecipe = async () => {
    if (!generatedRecipe) return

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: generatedRecipe.name,
          description: generatedRecipe.description || '',
          ingredients: generatedRecipe.ingredients,
          instructions: generatedRecipe.steps.join('\n'),
          prepTime: generatedRecipe.prepTime || 0,
          cookTime: generatedRecipe.cookTime || 0,
          servings: generatedRecipe.servings || 1,
          calories: generatedRecipe.calories || 0,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'Error saving recipe')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Type', icon: Utensils },
    { number: 2, title: 'Ingredients', icon: ShoppingCart },
    { number: 3, title: 'Purchase', icon: DollarSign },
    { number: 4, title: 'Budget', icon: DollarSign },
    { number: 5, title: 'Allergies', icon: AlertTriangle },
    { number: 6, title: 'Info', icon: Info },
    { number: 7, title: 'Preferences', icon: Sparkles },
  ]

  // Show generated recipe if available
  if (generatedRecipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{generatedRecipe.name}</h1>
              {generatedRecipe.description && (
                <p className="text-gray-600">{generatedRecipe.description}</p>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Information</h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Prep Time:</span>{' '}
                    <span className="text-gray-900">{generatedRecipe.prepTime} min</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Cook Time:</span>{' '}
                    <span className="text-gray-900">{generatedRecipe.cookTime} min</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Servings:</span>{' '}
                    <span className="text-gray-900">{generatedRecipe.servings}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Calories:</span>{' '}
                    <span className="text-gray-900">{generatedRecipe.calories} kcal</span>
                  </div>
                  {generatedRecipe.estimatedPrice && (
                    <div>
                      <span className="font-medium text-gray-700">Estimated Price:</span>{' '}
                      <span className="text-gray-900">{generatedRecipe.estimatedPrice.toFixed(2)} TND</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Ingredients</h2>
                <ul className="space-y-2">
                  {generatedRecipe.ingredients.map((ing: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span className="text-gray-700">{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {generatedRecipe.missingIngredients && generatedRecipe.missingIngredients.length > 0 && (
              <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients to Purchase</h2>
                <ul className="space-y-2">
                  {generatedRecipe.missingIngredients.map((ing: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      <span className="text-gray-700">{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Preparation Steps</h2>
              <ol className="space-y-4">
                {generatedRecipe.steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => {
                  setGeneratedRecipe(null)
                  setCurrentStep(1)
                  setFormData({
                    recipeType: '',
                    availableIngredients: [''],
                    canPurchase: null,
                    budget: '',
                    allergies: [],
                    additionalInfo: '',
                    cuisineType: '',
                    isHealthy: null,
                  })
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                New Recipe
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Recipe'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              const isSkipped = (step.number === 4 && !formData.canPurchase)
              
              if (isSkipped) return null
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : isCompleted
                          ? 'bg-primary-100 border-primary-600 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && !isSkipped && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Recipe type */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recipe Type</h2>
              <p className="text-gray-600 mb-6">Would you like a savory or sweet recipe?</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => updateFormData('recipeType', 'savory')}
                  className={`p-8 rounded-xl border-2 text-left transition-all ${
                    formData.recipeType === 'savory'
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-4xl mb-3">🍽️</div>
                  <h3 className="text-xl font-semibold mb-2">Savory</h3>
                  <p className="text-gray-600">Main dishes, appetizers, sides</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => updateFormData('recipeType', 'sweet')}
                  className={`p-8 rounded-xl border-2 text-left transition-all ${
                    formData.recipeType === 'sweet'
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-4xl mb-3">🍰</div>
                  <h3 className="text-xl font-semibold mb-2">Sweet</h3>
                  <p className="text-gray-600">Desserts, cakes, pastries</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Available ingredients */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Ingredients</h2>
              <p className="text-gray-600 mb-6">List the ingredients you already have at home</p>
              
              <div className="space-y-3">
                {formData.availableIngredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder={`Ingredient ${index + 1}`}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {formData.availableIngredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIngredient}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                >
                  + Add an ingredient
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Purchase decision */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase Ingredients</h2>
              <p className="text-gray-600 mb-6">Would you like to purchase missing ingredients or generate a recipe using only what you have?</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => updateFormData('canPurchase', true)}
                  className={`p-8 rounded-xl border-2 text-left transition-all ${
                    formData.canPurchase === true
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-4xl mb-3">🛒</div>
                  <h3 className="text-xl font-semibold mb-2">Yes, I can purchase</h3>
                  <p className="text-gray-600">I want to purchase missing ingredients</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => updateFormData('canPurchase', false)}
                  className={`p-8 rounded-xl border-2 text-left transition-all ${
                    formData.canPurchase === false
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-4xl mb-3">🏠</div>
                  <h3 className="text-xl font-semibold mb-2">No, use what I have</h3>
                  <p className="text-gray-600">Generate a recipe using only my ingredients</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {currentStep === 4 && formData.canPurchase && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget</h2>
              <p className="text-gray-600 mb-6">What is your maximum budget for missing ingredients?</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (TND) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => updateFormData('budget', e.target.value)}
                  placeholder="Ex: 50.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 5: Allergies */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Allergies and Restrictions</h2>
              <p className="text-gray-600 mb-6">Select your allergies. This information is pre-filled from your profile.</p>
              
              <div className="grid md:grid-cols-3 gap-4">
                {ALLERGIES_OPTIONS.map((allergy) => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.allergies.includes(allergy)
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Additional info */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>
              <p className="text-gray-600 mb-6">Add any additional information that might help generate your recipe</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Information (optional)
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => updateFormData('additionalInfo', e.target.value)}
                  rows={6}
                  placeholder="Ex: I like spicy dishes, I prefer quick recipes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 7: Cuisine type and health */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Culinary Preferences</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Cuisine Type *
                </label>
                <div className="grid md:grid-cols-3 gap-4">
                  {CUISINE_TYPES.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => updateFormData('cuisineType', cuisine)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.cuisineType === cuisine
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Health Preference *
                </label>
                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => updateFormData('isHealthy', true)}
                    className={`p-8 rounded-xl border-2 text-left transition-all ${
                      formData.isHealthy === true
                        ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-lg'
                        : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-4xl mb-3">🥗</div>
                    <h3 className="text-xl font-semibold mb-2">Healthy</h3>
                    <p className="text-gray-600">Balanced and nutritious recipe</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => updateFormData('isHealthy', false)}
                    className={`p-8 rounded-xl border-2 text-left transition-all ${
                      formData.isHealthy === false
                        ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-lg'
                        : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-4xl mb-3">🍕</div>
                    <h3 className="text-xl font-semibold mb-2">Indulgent</h3>
                    <p className="text-gray-600">Indulgent and comforting recipe</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Previous</span>
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? (
                  <>
                    <Sparkles size={20} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Generate Recipe</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

