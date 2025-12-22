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
  dietaryPreference?: string // 'vegetarian', 'vegan', 'normal', etc.
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
    estimatedPrice: 26.35, 
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
    estimatedPrice: 37.20, 
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
    estimatedPrice: 46.50, // ~15.00 USD * 3.1 TND
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
    estimatedPrice: 31.00, 
    cuisineType: 'Italian',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Vegetarian Couscous',
    description: 'Traditional Tunisian couscous with vegetables (vegetarian version)',
    ingredients: ['couscous', 'zucchini', 'carrots', 'chickpeas', 'potatoes', 'harissa', 'olive oil'],
    steps: [
      'Prepare the couscous by moistening it and letting it swell',
      'Cut all vegetables into pieces',
      'Cook the vegetables with spices and olive oil',
      'Cook the chickpeas separately',
      'Serve the couscous with the vegetables',
      'Accompany with harissa'
    ],
    prepTime: 20,
    cookTime: 45,
    servings: 6,
    calories: 380,
    estimatedPrice: 28.50,
    cuisineType: 'Tunisian',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Vegetarian Caesar Salad',
    description: 'Fresh and crispy salad without meat',
    ingredients: ['lettuce', 'croutons', 'parmesan', 'caesar dressing', 'cherry tomatoes'],
    steps: [
      'Wash and cut the lettuce',
      'Prepare the caesar dressing',
      'Mix the lettuce with the dressing',
      'Add the croutons, cherry tomatoes and parmesan',
      'Serve immediately'
    ],
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    calories: 280,
    estimatedPrice: 24.80,
    cuisineType: 'American',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Vegetable Stir Fry',
    description: 'Colorful mix of fresh vegetables',
    ingredients: ['bell peppers', 'broccoli', 'carrots', 'snow peas', 'soy sauce', 'ginger', 'garlic', 'olive oil'],
    steps: [
      'Cut all vegetables into bite-sized pieces',
      'Heat olive oil in a wok or large pan',
      'Add ginger and garlic, stir for 30 seconds',
      'Add vegetables and stir-fry for 5-7 minutes',
      'Add soy sauce and continue cooking for 2 minutes',
      'Serve hot with rice'
    ],
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    calories: 180,
    estimatedPrice: 22.00,
    cuisineType: 'Asian',
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
    estimatedPrice: 37.20, 
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
    estimatedPrice: 24.80, // ~8.00 USD * 3.1 TND
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
    estimatedPrice: 18.60, // ~6.00 USD * 3.1 TND
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
 * Liste des ingrédients non-végétariens/végans
 */
const MEAT_INGREDIENTS = [
  'chicken', 'poulet', 'beef', 'boeuf', 'pork', 'porc', 'lamb', 'agneau', 
  'meat', 'viande', 'bacon', 'ham', 'jambon', 'sausage', 'saucisse',
  'turkey', 'dinde', 'duck', 'canard', 'veal', 'veau', 'rabbit', 'lapin'
]

const FISH_INGREDIENTS = [
  'fish', 'poisson', 'salmon', 'saumon', 'tuna', 'thon', 'sardine', 
  'shrimp', 'crevette', 'crab', 'crabe', 'lobster', 'homard', 
  'mussel', 'moule', 'oyster', 'huître', 'seafood', 'fruits de mer'
]

const DAIRY_INGREDIENTS = [
  'milk', 'lait', 'cheese', 'fromage', 'butter', 'beurre', 
  'cream', 'crème', 'yogurt', 'yaourt', 'whey'
]

const EGG_INGREDIENTS = ['egg', 'eggs', 'œuf', 'œufs', 'egg white', 'egg yolk']

/**
 * Vérifie si une recette contient de la viande
 */
function containsMeat(recipe: Recipe): boolean {
  const recipeIngredients = recipe.ingredients.map(normalizeIngredient).join(' ')
  return MEAT_INGREDIENTS.some(meat => recipeIngredients.includes(meat))
}

/**
 * Vérifie si une recette contient du poisson
 */
function containsFish(recipe: Recipe): boolean {
  const recipeIngredients = recipe.ingredients.map(normalizeIngredient).join(' ')
  return FISH_INGREDIENTS.some(fish => recipeIngredients.includes(fish))
}

/**
 * Vérifie si une recette contient des produits laitiers
 */
function containsDairy(recipe: Recipe): boolean {
  const recipeIngredients = recipe.ingredients.map(normalizeIngredient).join(' ')
  return DAIRY_INGREDIENTS.some(dairy => recipeIngredients.includes(dairy))
}

/**
 * Vérifie si une recette contient des œufs
 */
function containsEggs(recipe: Recipe): boolean {
  const recipeIngredients = recipe.ingredients.map(normalizeIngredient).join(' ')
  return EGG_INGREDIENTS.some(egg => recipeIngredients.includes(egg))
}

/**
 * Vérifie si une recette respecte les préférences alimentaires
 */
function matchesDietaryPreference(recipe: Recipe, dietaryPreference?: string): boolean {
  if (!dietaryPreference || dietaryPreference === 'normal' || dietaryPreference === 'healthy') {
    return true // Pas de restriction
  }
  
  if (dietaryPreference === 'vegan') {
    // Végans : pas de viande, poisson, produits laitiers, œufs
    return !containsMeat(recipe) && 
           !containsFish(recipe) && 
           !containsDairy(recipe) && 
           !containsEggs(recipe)
  }
  
  if (dietaryPreference === 'vegetarian') {
    // Végétariens : pas de viande ni poisson, mais produits laitiers et œufs OK
    return !containsMeat(recipe) && !containsFish(recipe)
  }
  
  // Pour les autres préférences (keto, paleo), on accepte tout pour l'instant
  return true
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
  // Average estimated prices per ingredient in Tunisian Dinar (TND)
  // Prices are realistic for Tunisian market
  const priceMap: Record<string, number> = {
    'spaghetti': 4.50,
    'pasta': 4.50,
    'bacon': 9.00,
    'eggs': 7.50,
    'parmesan': 12.00,
    'chicken': 15.00,
    'lettuce': 4.50,
    'croutons': 6.00,
    'mushrooms': 9.00,
    'rice': 6.00,
    'arborio rice': 6.00,
    'chocolate': 10.50,
    'butter': 7.50,
    'flour': 3.00,
    'sugar': 4.50,
    'mascarpone': 12.00,
    'coffee': 6.00,
    'couscous': 6.00,
    'lamb meat': 24.00,
    'meat': 24.00,
    'vegetables': 9.00,
    'zucchini': 6.00,
    'carrots': 4.50,
    'chickpeas': 6.00,
    'harissa': 9.00,
    'black pepper': 3.00,
    'onion': 3.00,
    'white wine': 15.00,
    'broth': 6.00,
    'ladyfingers': 9.00,
    'cocoa': 6.00,
    'baking powder': 3.00,
    'apples': 6.00,
    'bananas': 4.50,
    'strawberries': 9.00,
    'oranges': 6.00,
    'honey': 12.00,
    'mint': 3.00,
    'caesar dressing': 9.00,
    'tomatoes': 4.50,
    'garlic': 3.00,
    'olive oil': 8.00,
    'basil': 3.00,
    'mozzarella': 10.00,
    'potatoes': 3.00,
    'bell peppers': 5.00,
    'fish': 18.00,
    'shrimp': 25.00,
    'beef': 22.00,
    'pork': 20.00,
  }
  
  let total = 0
  for (const ing of missingIngredients) {
    const normalized = normalizeIngredient(ing)
    // Chercher une correspondance partielle
    const match = Object.keys(priceMap).find(key => 
      normalized.includes(key) || key.includes(normalized)
    )
    total += match ? priceMap[match] : 6.00 // Prix par défaut en TND
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
    
    // CRITICAL: Respect dietary preferences (vegetarian, vegan, etc.)
    if (!matchesDietaryPreference(recipe, request.dietaryPreference)) return false
    
    return true
  })
  
  // If no recipe matches cuisine type, try without cuisine filter
  if (candidates.length === 0 && request.cuisineType && request.cuisineType !== 'Other') {
    candidates = RECIPE_TEMPLATES.filter(recipe => {
      if (recipe.recipeType !== request.recipeType) return false
      if (containsAllergens(recipe, request.allergies)) return false
      if (!matchesDietaryPreference(recipe, request.dietaryPreference)) return false
      return true
    })
  }
  
  // If still no recipe, use all recipes of the correct type (but still respect dietary preferences)
  if (candidates.length === 0) {
    candidates = RECIPE_TEMPLATES.filter(r => {
      if (r.recipeType !== request.recipeType) return false
      if (containsAllergens(r, request.allergies)) return false
      if (!matchesDietaryPreference(r, request.dietaryPreference)) return false
      return true
    })
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

