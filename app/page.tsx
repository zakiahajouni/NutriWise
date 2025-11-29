'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, UtensilsCrossed, TrendingUp, CheckCircle } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    totalMeals: 0,
  })

  useEffect(() => {
    // Load statistics
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats)
        }
      })
      .catch(() => {
        // Default values if API is not available
        setStats({ totalUsers: 1250, totalRecipes: 3500, totalMeals: 8900 })
      })
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Plan your meals
                <span className="text-primary-600 block">intelligently</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                NutriWise helps you create personalized meals based on your preferences,
                allergies, and health goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="#features"
                  className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="animate-fade-in">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=600&fit=crop"
                  alt="Healthy meal"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl font-bold text-primary-600">{stats.totalMeals.toLocaleString()}+</div>
                  <div className="text-gray-600">Meals planned</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-primary-50 rounded-xl">
              <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalUsers.toLocaleString()}+
              </div>
              <div className="text-gray-600">Active users</div>
            </div>
            <div className="text-center p-8 bg-primary-50 rounded-xl">
              <UtensilsCrossed className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalRecipes.toLocaleString()}+
              </div>
              <div className="text-gray-600">Recipes created</div>
            </div>
            <div className="text-center p-8 bg-primary-50 rounded-xl">
              <TrendingUp className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stats.totalMeals.toLocaleString()}+
              </div>
              <div className="text-gray-600">Meals planned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why choose NutriWise?
            </h2>
            <p className="text-xl text-gray-600">
              A complete solution for your nutritional well-being
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Personalized Suggestions
              </h3>
              <p className="text-gray-600">
                Receive recommendations tailored to your dietary preferences,
                allergies, and health goals.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Smart Planning
              </h3>
              <p className="text-gray-600">
                Plan your weekly meals in just a few clicks with our
                intelligent planning system.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Complete History
              </h3>
              <p className="text-gray-600">
                View all your created recipes and modify them according to your needs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Allergy Management
              </h3>
              <p className="text-gray-600">
                Specify your allergies and dietary restrictions for always
                safe recipes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Modern Interface
              </h3>
              <p className="text-gray-600">
                Enjoy an intuitive and elegant interface for an optimal
                user experience.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Nutrition Tracking
              </h3>
              <p className="text-gray-600">
                Track your nutritional intake and achieve your health goals
                easily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to transform your diet?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users who trust NutriWise
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Create a free account
          </Link>
        </div>
      </section>
    </div>
  )
}

