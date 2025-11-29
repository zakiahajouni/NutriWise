/**
 * ML system for intelligent recipe generation
 * Uses content-based filtering and ingredient matching
 */

interface Recipe {
  name: string
  description: string
  ingredients: string[]
  steps: string[]
  prepTime: number
  cookTime: number
  servings: number
  calories: number
  estimatedPrice: number
  missingIngredients?: string[]
  cuisineType: string
  recipeType: 'sweet' | 'savory'
  isHealthy: boolean
}

interface RecipeRequest {
  recipeType: 'sweet' | 'savory'
  availableIngredients: string[]
  canPurchase: boolean
  budget: number | null
  allergies: string[]
  additionalInfo: string
  cuisineType: string
  isHealthy: boolean
}

// Recipe database (dynamic, can be loaded from DB)
// In production, this should be loaded from a `recipe_templates` table in the DB
const RECIPE_TEMPLATES: Recipe[] = [
  // Savory recipes
  {
    name: 'Spaghetti Carbonara',
    description: 'A creamy and savory Italian classic',
    ingredients: ['spaghetti', 'bacon', 'eggs', 'parmesan', 'black pepper'],
    steps: [
      'Cook the spaghetti in boiling salted water',
      'Fry the bacon in a pan',
      'Mix the eggs with grated parmesan',
      'Drain the pasta and mix with the bacon',
      'Add the egg-parmesan mixture off the heat while stirring quickly',
      'Serve with black pepper'
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    calories: 520,
    estimatedPrice: 8.50,
    cuisineType: 'Italian',
    recipeType: 'savory',
    isHealthy: false
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh and crispy salad with grilled chicken',
    ingredients: ['lettuce', 'chicken', 'parmesan', 'croutons', 'caesar dressing'],
    steps: [
      'Wash and cut the lettuce',
      'Grill the chicken and cut into cubes',
      'Prepare the caesar dressing',
      'Mix the lettuce with the dressing',
      'Add the chicken, croutons and parmesan',
      'Serve immediately'
    ],
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    calories: 380,
    estimatedPrice: 12.00,
    cuisineType: 'American',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Tunisian Couscous',
    description: 'Traditional Tunisian dish with vegetables and meat',
    ingredients: ['couscous', 'lamb meat', 'zucchini', 'carrots', 'chickpeas', 'harissa'],
    steps: [
      'Prepare the couscous by moistening it and letting it swell',
      'Cook the meat with spices',
      'Add the vegetables cut into pieces',
      'Cook the chickpeas separately',
      'Serve the couscous with the meat and vegetables',
      'Accompany with harissa'
    ],
    prepTime: 20,
    cookTime: 60,
    servings: 6,
    calories: 450,
    estimatedPrice: 15.00,
    cuisineType: 'Tunisian',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Mushroom Risotto',
    description: 'Creamy mushroom risotto',
    ingredients: ['arborio rice', 'mushrooms', 'broth', 'white wine', 'parmesan', 'onion'],
    steps: [
      'Sauté the onion in olive oil',
      'Add the rice and sauté for 2 minutes',
      'Add the white wine and let it evaporate',
      'Add the hot broth gradually while stirring',
      'Sauté the mushrooms separately',
      'Mix the risotto with the mushrooms and parmesan'
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    calories: 420,
    estimatedPrice: 10.00,
    cuisineType: 'Italian',
    recipeType: 'savory',
    isHealthy: true
  },
  // Sweet recipes
  {
    name: 'Tiramisu',
    description: 'Classic Italian coffee dessert',
    ingredients: ['mascarpone', 'eggs', 'sugar', 'coffee', 'ladyfingers', 'cocoa'],
    steps: [
      'Separate the egg whites from the yolks',
      'Beat the yolks with sugar',
      'Add the mascarpone',
      'Whip the whites and fold them in',
      'Dip the ladyfingers in coffee',
      'Alternate layers of ladyfingers and cream',
      'Sprinkle with cocoa and refrigerate'
    ],
    prepTime: 30,
    cookTime: 0,
    servings: 8,
    calories: 320,
    estimatedPrice: 12.00,
    cuisineType: 'Italian',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Chocolate Cake',
    description: 'Moist chocolate cake',
    ingredients: ['chocolate', 'butter', 'eggs', 'sugar', 'flour', 'baking powder'],
    steps: [
      'Melt the chocolate with butter',
      'Beat the eggs with sugar',
      'Mix in the melted chocolate',
      'Add the flour and baking powder',
      'Pour into a pan and bake for 25 minutes',
      'Let cool before unmolding'
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 8,
    calories: 380,
    estimatedPrice: 8.00,
    cuisineType: 'French',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Fresh Fruit Salad',
    description: 'Seasonal fruit salad',
    ingredients: ['apples', 'bananas', 'strawberries', 'oranges', 'honey', 'mint'],
    steps: [
      'Wash and cut all the fruits',
      'Mix the fruits in a bowl',
      'Drizzle with honey',
      'Add mint leaves',
      'Refrigerate before serving'
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    calories: 120,
    estimatedPrice: 6.00,
    cuisineType: 'Mediterranean',
    recipeType: 'sweet',
    isHealthy: true
  }
]

/**
 * Normalise un ingrédient pour la comparaison
 */
function normalizeIngredient(ingredient: string): string {
  return ingredient.toLowerCase().trim()
}

/**
 * Calcule la similarité cosine entre deux listes d'ingrédients
 */
export function cosineSimilarity(ingredients1: string[], ingredients2: string[]): number {
  const normalized1 = ingredients1.map(normalizeIngredient)
  const normalized2 = ingredients2.map(normalizeIngredient)
  
  const set1 = new Set(normalized1)
  const set2 = new Set(normalized2)
  
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)))
  const union = new Set([...Array.from(set1), ...Array.from(set2)])
  
  if (union.size === 0) return 0
  
  // Jaccard similarity (simplifié pour la similarité d'ingrédients)
  return intersection.size / union.size
}

/**
 * Vérifie si une recette contient des allergènes
 */
function containsAllergens(recipe: Recipe, allergies: string[]): boolean {
  if (allergies.length === 0) return false
  
  const recipeIngredients = recipe.ingredients.map(normalizeIngredient).join(' ')
  const normalizedAllergies = allergies.map(normalizeIngredient)
  
  return normalizedAllergies.some(allergy => 
    recipeIngredients.includes(allergy) || 
    recipeIngredients.includes(allergy.replace(' ', ''))
  )
}

/**
 * Calculates a recipe score based on multiple criteria
 */
function calculateRecipeScore(
  recipe: Recipe,
  request: RecipeRequest,
  similarity: number
): number {
  let score = similarity * 0.4 // 40% based on ingredient similarity
  
  // Bonus for matching recipe type (20%)
  if (recipe.recipeType === request.recipeType) {
    score += 0.2
  }
  
  // Bonus for matching cuisine type (15%)
  if (recipe.cuisineType.toLowerCase() === request.cuisineType.toLowerCase()) {
    score += 0.15
  }
  
  // Bonus for health preference (15%)
  if (recipe.isHealthy === request.isHealthy) {
    score += 0.15
  }
  
  // Penalty if recipe contains allergens (10%)
  if (containsAllergens(recipe, request.allergies)) {
    score -= 0.1
  }
  
  // Bonus if price is within budget (if applicable)
  if (request.canPurchase && request.budget && recipe.estimatedPrice <= request.budget) {
    score += 0.1
  }
  
  return Math.max(0, Math.min(1, score)) // Normalize between 0 and 1
}

/**
 * Identifie les ingrédients manquants
 */
export function findMissingIngredients(
  recipe: Recipe,
  availableIngredients: string[]
): string[] {
  const normalizedAvailable = availableIngredients.map(normalizeIngredient)
  const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
  
  return normalizedRecipe.filter(ing => 
    !normalizedAvailable.some(avail => 
      avail.includes(ing) || ing.includes(avail)
    )
  )
}

/**
 * Estime le prix des ingrédients manquants
 */
export function estimateMissingPrice(missingIngredients: string[]): number {
  // Average estimated prices per ingredient (in production, load from DB)
  const priceMap: Record<string, number> = {
    'spaghetti': 1.50,
    'pasta': 1.50,
    'bacon': 3.00,
    'eggs': 2.50,
    'parmesan': 4.00,
    'chicken': 5.00,
    'lettuce': 1.50,
    'croutons': 2.00,
    'mushrooms': 3.00,
    'rice': 2.00,
    'arborio rice': 2.00,
    'chocolate': 3.50,
    'butter': 2.50,
    'flour': 1.00,
    'sugar': 1.50,
    'mascarpone': 4.00,
    'coffee': 2.00,
    'couscous': 2.00,
    'lamb meat': 8.00,
    'meat': 8.00,
    'vegetables': 3.00,
    'zucchini': 2.00,
    'carrots': 1.50,
    'chickpeas': 2.00,
    'harissa': 3.00,
    'black pepper': 1.00,
    'onion': 1.00,
    'white wine': 5.00,
    'broth': 2.00,
    'ladyfingers': 3.00,
    'cocoa': 2.00,
    'baking powder': 1.00,
    'apples': 2.00,
    'bananas': 1.50,
    'strawberries': 3.00,
    'oranges': 2.00,
    'honey': 4.00,
    'mint': 1.00,
    'caesar dressing': 3.00,
  }
  
  let total = 0
  for (const ing of missingIngredients) {
    const normalized = normalizeIngredient(ing)
    // Chercher une correspondance partielle
    const match = Object.keys(priceMap).find(key => 
      normalized.includes(key) || key.includes(normalized)
    )
    total += match ? priceMap[match] : 2.00 // Prix par défaut
  }
  
  return total
}

/**
 * Generates a personalized recipe based on criteria
 */
export function generateRecipe(request: RecipeRequest): Recipe {
  // Filter recipes according to basic criteria
  let candidates = RECIPE_TEMPLATES.filter(recipe => {
    // Recipe type must match
    if (recipe.recipeType !== request.recipeType) return false
    
    // Cuisine type must match (high priority)
    if (request.cuisineType && request.cuisineType !== 'Other') {
      if (recipe.cuisineType.toLowerCase() !== request.cuisineType.toLowerCase()) {
        return false
      }
    }
    
    // Don't include recipes with allergens
    if (containsAllergens(recipe, request.allergies)) return false
    
    return true
  })
  
  // If no recipe matches cuisine type, try without cuisine filter
  if (candidates.length === 0 && request.cuisineType && request.cuisineType !== 'Other') {
    candidates = RECIPE_TEMPLATES.filter(recipe => {
      if (recipe.recipeType !== request.recipeType) return false
      if (containsAllergens(recipe, request.allergies)) return false
      return true
    })
  }
  
  // If still no recipe, use all recipes of the correct type
  if (candidates.length === 0) {
    candidates = RECIPE_TEMPLATES.filter(r => r.recipeType === request.recipeType)
  }
  
  // Calculate scores for each recipe
  const scoredRecipes = candidates.map(recipe => {
    const similarity = cosineSimilarity(
      request.availableIngredients,
      recipe.ingredients
    )
    const score = calculateRecipeScore(recipe, request, similarity)
    return { recipe, score, similarity }
  })
  
  // Sort by descending score
  scoredRecipes.sort((a, b) => b.score - a.score)
  
  // Take the best recipe
  const bestMatch = scoredRecipes[0]?.recipe || candidates[0]
  
  // Create a copy of the recipe to personalize
  const generatedRecipe: Recipe = {
    ...bestMatch,
    missingIngredients: [],
    estimatedPrice: bestMatch.estimatedPrice
  }
  
  // Identify missing ingredients
  const missingIngredients = findMissingIngredients(
    generatedRecipe,
    request.availableIngredients
  )
  
  generatedRecipe.missingIngredients = missingIngredients
  
  // If user can purchase, adjust estimated price
  if (request.canPurchase && missingIngredients.length > 0) {
    const missingPrice = estimateMissingPrice(missingIngredients)
    generatedRecipe.estimatedPrice = missingPrice
    
    // If budget is exceeded, try to find a cheaper alternative
    if (request.budget && missingPrice > request.budget) {
      // Look for a recipe with better quality/price ratio
      const affordableRecipes = scoredRecipes
        .filter(sr => {
          const missing = findMissingIngredients(sr.recipe, request.availableIngredients)
          const price = estimateMissingPrice(missing)
          return price <= (request.budget || Infinity)
        })
        .sort((a, b) => b.score - a.score)
      
      if (affordableRecipes.length > 0) {
        const affordable = affordableRecipes[0].recipe
        const missing = findMissingIngredients(affordable, request.availableIngredients)
        return {
          ...affordable,
          missingIngredients: missing,
          estimatedPrice: estimateMissingPrice(missing)
        }
      }
    }
  } else {
    // If user cannot purchase, check that they have all ingredients
    if (missingIngredients.length > 0) {
      // Try to find a recipe with available ingredients
      const availableRecipes = scoredRecipes
        .filter(sr => {
          const missing = findMissingIngredients(sr.recipe, request.availableIngredients)
          return missing.length === 0
        })
        .sort((a, b) => b.score - a.score)
      
      if (availableRecipes.length > 0) {
        const available = availableRecipes[0].recipe
        return {
          ...available,
          missingIngredients: [],
          estimatedPrice: 0
        }
      }
    }
  }
  
  return generatedRecipe
}

/**
 * Predicts user profile based on their data
 */
export function predictUserProfile(userData: {
  age?: number
  gender?: string
  dietaryPreference?: string
  allergies?: string[]
  healthConditions?: string[]
}): string {
  // Simple classification based on preferences
  // In production, use a real ML model (KMeans, Random Forest, etc.)
  
  const { dietaryPreference, allergies, healthConditions } = userData
  
  if (dietaryPreference === 'vegan' || dietaryPreference === 'vegetarian') {
    return 'health_conscious'
  }
  
  if (dietaryPreference === 'keto' || dietaryPreference === 'paleo') {
    return 'fitness_focused'
  }
  
  if (allergies && allergies.length > 2) {
    return 'restricted_diet'
  }
  
  if (healthConditions && healthConditions.length > 0) {
    return 'health_aware'
  }
  
  if (dietaryPreference === 'healthy') {
    return 'balanced_eater'
  }
  
  return 'flexible_eater'
}

