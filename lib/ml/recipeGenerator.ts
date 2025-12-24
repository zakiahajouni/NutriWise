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
  suggestionNote?: string // Note informative pour les ingrédients requis
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
  },
  // Simple recipes with few ingredients
  {
    name: 'Chocolate Fondue',
    description: 'Simple chocolate fondue',
    ingredients: ['chocolate', 'cream'],
    steps: [
      'Melt chocolate in a double boiler',
      'Add cream and stir until smooth',
      'Serve warm with fruits or bread'
    ],
    prepTime: 5,
    cookTime: 10,
    servings: 4,
    calories: 250,
    estimatedPrice: 15.50,
    cuisineType: 'French',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Chocolate Mousse',
    description: 'Simple chocolate mousse',
    ingredients: ['chocolate', 'eggs', 'sugar'],
    steps: [
      'Melt chocolate',
      'Separate egg whites and yolks',
      'Beat yolks with sugar',
      'Mix with melted chocolate',
      'Whip whites and fold in',
      'Refrigerate for 2 hours'
    ],
    prepTime: 20,
    cookTime: 0,
    servings: 4,
    calories: 280,
    estimatedPrice: 18.60,
    cuisineType: 'French',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Simple Chocolate Cookies',
    description: 'Easy chocolate cookies',
    ingredients: ['chocolate', 'butter', 'sugar', 'flour'],
    steps: [
      'Mix butter and sugar',
      'Add melted chocolate',
      'Add flour and mix',
      'Form cookies and bake for 12 minutes'
    ],
    prepTime: 10,
    cookTime: 12,
    servings: 12,
    calories: 150,
    estimatedPrice: 12.40,
    cuisineType: 'American',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Chocolate Smoothie',
    description: 'Quick chocolate smoothie',
    ingredients: ['chocolate', 'milk', 'banana'],
    steps: [
      'Blend chocolate with milk',
      'Add banana',
      'Blend until smooth',
      'Serve cold'
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    calories: 200,
    estimatedPrice: 9.30,
    cuisineType: 'American',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Simple Pasta',
    description: 'Basic pasta dish',
    ingredients: ['pasta', 'olive oil', 'garlic'],
    steps: [
      'Cook pasta in salted water',
      'Heat olive oil with garlic',
      'Drain pasta and mix with oil',
      'Serve hot'
    ],
    prepTime: 5,
    cookTime: 15,
    servings: 2,
    calories: 350,
    estimatedPrice: 8.50,
    cuisineType: 'Italian',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Garlic Bread',
    description: 'Simple garlic bread',
    ingredients: ['bread', 'butter', 'garlic'],
    steps: [
      'Mix butter with minced garlic',
      'Spread on bread slices',
      'Bake for 10 minutes until golden'
    ],
    prepTime: 5,
    cookTime: 10,
    servings: 4,
    calories: 180,
    estimatedPrice: 6.20,
    cuisineType: 'Italian',
    recipeType: 'savory',
    isHealthy: false
  },
  {
    name: 'Simple Salad',
    description: 'Basic green salad',
    ingredients: ['lettuce', 'olive oil', 'lemon'],
    steps: [
      'Wash and cut lettuce',
      'Drizzle with olive oil and lemon',
      'Toss and serve'
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    calories: 80,
    estimatedPrice: 7.75,
    cuisineType: 'Mediterranean',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Scrambled Eggs',
    description: 'Simple scrambled eggs',
    ingredients: ['eggs', 'butter', 'salt'],
    steps: [
      'Beat eggs with salt',
      'Heat butter in pan',
      'Cook eggs while stirring',
      'Serve hot'
    ],
    prepTime: 2,
    cookTime: 5,
    servings: 2,
    calories: 200,
    estimatedPrice: 7.50,
    cuisineType: 'American',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Rice with Vegetables',
    description: 'Simple rice dish',
    ingredients: ['rice', 'carrots', 'onion', 'olive oil'],
    steps: [
      'Cook rice',
      'Sauté vegetables in olive oil',
      'Mix with rice',
      'Serve hot'
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    calories: 250,
    estimatedPrice: 9.30,
    cuisineType: 'Asian',
    recipeType: 'savory',
    isHealthy: true
  },
  // Simple recipes with potato only
  {
    name: 'Baked Potatoes',
    description: 'Simple baked potatoes',
    ingredients: ['potato'],
    steps: [
      'Wash potatoes',
      'Prick with fork',
      'Bake at 200°C for 45 minutes',
      'Serve hot'
    ],
    prepTime: 5,
    cookTime: 45,
    servings: 2,
    calories: 200,
    estimatedPrice: 3.00,
    cuisineType: 'American',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Mashed Potatoes',
    description: 'Simple mashed potatoes',
    ingredients: ['potato', 'butter'],
    steps: [
      'Boil potatoes until tender',
      'Mash with butter',
      'Season with salt',
      'Serve hot'
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    calories: 180,
    estimatedPrice: 10.50,
    cuisineType: 'American',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Potato Salad',
    description: 'Simple potato salad',
    ingredients: ['potato', 'olive oil', 'lemon'],
    steps: [
      'Boil potatoes until tender',
      'Cut into cubes',
      'Mix with olive oil and lemon',
      'Serve cold'
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    calories: 150,
    estimatedPrice: 10.50,
    cuisineType: 'Mediterranean',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Fried Potatoes',
    description: 'Simple fried potatoes',
    ingredients: ['potato', 'olive oil'],
    steps: [
      'Cut potatoes into slices',
      'Heat oil in pan',
      'Fry until golden',
      'Serve hot'
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    calories: 250,
    estimatedPrice: 8.00,
    cuisineType: 'French',
    recipeType: 'savory',
    isHealthy: false
  },
  {
    name: 'Roasted Potatoes',
    description: 'Simple roasted potatoes',
    ingredients: ['potato', 'olive oil', 'salt'],
    steps: [
      'Cut potatoes into wedges',
      'Toss with olive oil and salt',
      'Roast at 200°C for 30 minutes',
      'Serve hot'
    ],
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    calories: 200,
    estimatedPrice: 8.00,
    cuisineType: 'Mediterranean',
    recipeType: 'savory',
    isHealthy: true
  },
  // Recettes avec un seul ingrédient principal (pour cas d'un seul ingrédient fourni)
  {
    name: 'Chocolate Bar',
    description: 'Dégustation simple de chocolat',
    ingredients: ['chocolate'],
    steps: [
      'Ouvrir l\'emballage du chocolat',
      'Déguster directement'
    ],
    prepTime: 1,
    cookTime: 0,
    servings: 1,
    calories: 150,
    estimatedPrice: 3.50,
    cuisineType: 'French',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Chocolate Chips',
    description: 'Chocolat en morceaux pour grignotage',
    ingredients: ['chocolate'],
    steps: [
      'Couper le chocolat en petits morceaux',
      'Servir dans un bol',
      'Déguster'
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    calories: 200,
    estimatedPrice: 3.50,
    cuisineType: 'French',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Chocolate Shavings',
    description: 'Copeaux de chocolat pour décoration',
    ingredients: ['chocolate'],
    steps: [
      'Râper le chocolat avec une râpe fine',
      'Conserver les copeaux au frais',
      'Utiliser pour décorer vos desserts'
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 4,
    calories: 100,
    estimatedPrice: 3.50,
    cuisineType: 'French',
    recipeType: 'sweet',
    isHealthy: false
  },
  {
    name: 'Simple Apple',
    description: 'Pomme fraîche nature',
    ingredients: ['apple'],
    steps: [
      'Laver la pomme',
      'Déguster directement'
    ],
    prepTime: 1,
    cookTime: 0,
    servings: 1,
    calories: 80,
    estimatedPrice: 2.00,
    cuisineType: 'Mediterranean',
    recipeType: 'sweet',
    isHealthy: true
  },
  {
    name: 'Apple Slices',
    description: 'Pomme coupée en tranches',
    ingredients: ['apple'],
    steps: [
      'Laver la pomme',
      'Couper en tranches',
      'Retirer les pépins',
      'Servir'
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    calories: 80,
    estimatedPrice: 2.00,
    cuisineType: 'Mediterranean',
    recipeType: 'sweet',
    isHealthy: true
  },
  {
    name: 'Banana',
    description: 'Banane fraîche nature',
    ingredients: ['banana'],
    steps: [
      'Peler la banane',
      'Déguster directement'
    ],
    prepTime: 1,
    cookTime: 0,
    servings: 1,
    calories: 90,
    estimatedPrice: 1.50,
    cuisineType: 'Mediterranean',
    recipeType: 'sweet',
    isHealthy: true
  },
  {
    name: 'Banana Slices',
    description: 'Banane coupée en rondelles',
    ingredients: ['banana'],
    steps: [
      'Peler la banane',
      'Couper en rondelles',
      'Servir dans un bol'
    ],
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    calories: 90,
    estimatedPrice: 1.50,
    cuisineType: 'Mediterranean',
    recipeType: 'sweet',
    isHealthy: true
  },
  {
    name: 'Simple Egg',
    description: 'Œuf dur simple',
    ingredients: ['egg'],
    steps: [
      'Placer l\'œuf dans l\'eau bouillante',
      'Cuire pendant 10 minutes',
      'Refroidir sous l\'eau froide',
      'Peler et servir'
    ],
    prepTime: 2,
    cookTime: 10,
    servings: 1,
    calories: 70,
    estimatedPrice: 1.00,
    cuisineType: 'French',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Boiled Egg',
    description: 'Œuf à la coque',
    ingredients: ['egg'],
    steps: [
      'Placer l\'œuf dans l\'eau bouillante',
      'Cuire pendant 3 minutes',
      'Servir dans un coquetier'
    ],
    prepTime: 1,
    cookTime: 3,
    servings: 1,
    calories: 70,
    estimatedPrice: 1.00,
    cuisineType: 'French',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Simple Rice',
    description: 'Riz blanc cuit',
    ingredients: ['rice'],
    steps: [
      'Rincer le riz',
      'Cuire dans l\'eau bouillante pendant 15 minutes',
      'Égoutter et servir'
    ],
    prepTime: 2,
    cookTime: 15,
    servings: 2,
    calories: 200,
    estimatedPrice: 2.00,
    cuisineType: 'Asian',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Plain Pasta',
    description: 'Pâtes simples cuites',
    ingredients: ['pasta'],
    steps: [
      'Cuire les pâtes dans l\'eau bouillante salée',
      'Égoutter après 10 minutes',
      'Servir chaud'
    ],
    prepTime: 2,
    cookTime: 10,
    servings: 2,
    calories: 220,
    estimatedPrice: 2.50,
    cuisineType: 'Italian',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Simple Bread',
    description: 'Pain frais',
    ingredients: ['bread'],
    steps: [
      'Couper une tranche de pain',
      'Servir'
    ],
    prepTime: 1,
    cookTime: 0,
    servings: 1,
    calories: 80,
    estimatedPrice: 1.00,
    cuisineType: 'French',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Toast',
    description: 'Pain grillé',
    ingredients: ['bread'],
    steps: [
      'Couper une tranche de pain',
      'Griller au grille-pain',
      'Servir chaud'
    ],
    prepTime: 2,
    cookTime: 3,
    servings: 1,
    calories: 80,
    estimatedPrice: 1.00,
    cuisineType: 'French',
    recipeType: 'savory',
    isHealthy: true
  },
  // Recettes avec tomates
  {
    name: 'Fresh Tomato',
    description: 'Tomate fraîche nature',
    ingredients: ['tomato'],
    steps: [
      'Laver la tomate',
      'Couper en tranches',
      'Servir avec un peu de sel'
    ],
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    calories: 20,
    estimatedPrice: 1.50,
    cuisineType: 'Mediterranean',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Tomato Salad',
    description: 'Salade de tomates simple',
    ingredients: ['tomato'],
    steps: [
      'Laver et couper les tomates en tranches',
      'Disposer sur une assiette',
      'Assaisonner avec du sel',
      'Servir frais'
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    calories: 25,
    estimatedPrice: 1.50,
    cuisineType: 'Mediterranean',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Tomato Slices',
    description: 'Tranches de tomates',
    ingredients: ['tomato'],
    steps: [
      'Laver la tomate',
      'Couper en rondelles',
      'Servir'
    ],
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    calories: 20,
    estimatedPrice: 1.50,
    cuisineType: 'Mediterranean',
    recipeType: 'savory',
    isHealthy: true
  },
  {
    name: 'Roasted Tomato',
    description: 'Tomate rôtie',
    ingredients: ['tomato'],
    steps: [
      'Couper la tomate en deux',
      'Placer au four à 180°C',
      'Cuire pendant 20 minutes',
      'Servir chaud'
    ],
    prepTime: 5,
    cookTime: 20,
    servings: 1,
    calories: 25,
    estimatedPrice: 1.50,
    cuisineType: 'Mediterranean',
    recipeType: 'savory',
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
 * Calcule la similarité améliorée entre deux listes d'ingrédients
 * Utilise une approche plus intelligente avec correspondance partielle
 */
export function cosineSimilarity(ingredients1: string[], ingredients2: string[]): number {
  const normalized1 = ingredients1.map(normalizeIngredient)
  const normalized2 = ingredients2.map(normalizeIngredient)
  
  // Correspondance exacte
  const set1 = new Set(normalized1)
  const set2 = new Set(normalized2)
  const exactMatches = new Set(Array.from(set1).filter(x => set2.has(x)))
  
  // Correspondance partielle (un ingrédient contient l'autre)
  let partialMatches = 0
  for (const ing1 of normalized1) {
    for (const ing2 of normalized2) {
      // Vérifier si un ingrédient contient l'autre (ex: "chicken" et "chicken breast")
      if (ing1.includes(ing2) || ing2.includes(ing1)) {
        if (!exactMatches.has(ing1) && !exactMatches.has(ing2)) {
          partialMatches++
        }
      }
    }
  }
  
  const union = new Set([...Array.from(set1), ...Array.from(set2)])
  
  if (union.size === 0) return 0
  
  // Score combiné : correspondances exactes + correspondances partielles (avec poids réduit)
  const exactScore = exactMatches.size / union.size
  const partialScore = (partialMatches * 0.5) / union.size // Poids réduit pour les correspondances partielles
  
  return Math.min(1, exactScore + partialScore)
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
 * Calculates an improved recipe score based on multiple criteria
 * Système de scoring amélioré pour réduire les erreurs
 * Gère spécialement les cas d'un seul ingrédient
 */
function calculateRecipeScore(
  recipe: Recipe,
  request: RecipeRequest,
  similarity: number
): number {
  const isSingleIngredient = request.availableIngredients.length === 1
  const recipeIngredientCount = recipe.ingredients.length
  
  // Score de base basé sur la similarité d'ingrédients (50% - plus important)
  let score = similarity * 0.5
  
  // BONUS SPÉCIAL pour les recettes simples quand un seul ingrédient est fourni
  if (isSingleIngredient) {
    // Favoriser les recettes avec peu d'ingrédients (1-3 ingrédients)
    if (recipeIngredientCount <= 3) {
      score += 0.3 // Bonus important pour les recettes simples
    } else if (recipeIngredientCount <= 5) {
      score += 0.15 // Bonus modéré
    } else {
      score *= 0.7 // Pénalité pour les recettes complexes
    }
    
    // Bonus supplémentaire si la recette contient l'ingrédient unique fourni (correspondance stricte)
    const normalizedAvailable = request.availableIngredients.map(normalizeIngredient)
    const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
    const hasMainIngredient = normalizedRecipe.some(recipeIng => 
      normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
    )
    if (hasMainIngredient) {
      score += 0.2 // Bonus si l'ingrédient principal est présent
    }
  }
  
  // Vérifier que le type de recette correspond (OBLIGATOIRE - pénalité forte si non)
  if (recipe.recipeType !== request.recipeType) {
    score *= 0.1 // Réduction drastique si le type ne correspond pas
  } else {
    score += 0.2 // Bonus si correspond
  }
  
  // Bonus pour le type de cuisine (15%)
  if (request.cuisineType && request.cuisineType !== 'Other') {
    if (recipe.cuisineType.toLowerCase() === request.cuisineType.toLowerCase()) {
      score += 0.15
    } else {
      score *= 0.7 // Pénalité si cuisine ne correspond pas
    }
  }
  
  // Bonus pour préférence santé (10%)
  if (recipe.isHealthy === request.isHealthy) {
    score += 0.1
  } else {
    score *= 0.9 // Légère pénalité
  }
  
  // Pénalité FORTE si la recette contient des allergènes (réduction de 50%)
  if (containsAllergens(recipe, request.allergies)) {
    score *= 0.5
  }
  
  // Bonus si prix dans le budget (5%)
  if (request.canPurchase && request.budget) {
    const missing = findMissingIngredients(recipe, request.availableIngredients)
    const missingPrice = estimateMissingPrice(missing)
    if (missingPrice <= request.budget) {
      score += 0.05
    } else {
      score *= 0.8 // Pénalité si dépasse le budget
    }
  }
  
  // Bonus si l'utilisateur a tous les ingrédients (5%)
  const missing = findMissingIngredients(recipe, request.availableIngredients)
  if (missing.length === 0) {
    score += 0.05
  }
  
  return Math.max(0, Math.min(1, score)) // Normalize between 0 and 1
}

/**
 * Vérifie si deux ingrédients correspondent (version stricte)
 */
function ingredientsMatch(ingredient1: string, ingredient2: string): boolean {
  const norm1 = normalizeIngredient(ingredient1)
  const norm2 = normalizeIngredient(ingredient2)
  
  // Correspondance exacte
  if (norm1 === norm2) return true
  
  // Correspondance après suppression du pluriel
  const base1 = norm1.replace(/s$/, '')
  const base2 = norm2.replace(/s$/, '')
  if (base1 === base2 && base1.length > 2) return true // Éviter les correspondances trop courtes
  
  // Correspondance seulement si un est contenu dans l'autre ET que c'est significatif
  // Ex: "tomato" dans "tomatoes" OK, mais "to" dans "tomato" NON
  if (norm1.length >= 4 && norm2.length >= 4) {
    if (norm1.includes(norm2) && norm2.length >= norm1.length * 0.7) return true
    if (norm2.includes(norm1) && norm1.length >= norm2.length * 0.7) return true
  }
  
  return false
}

/**
 * Identifie les ingrédients manquants avec correspondance améliorée et stricte
 */
export function findMissingIngredients(
  recipe: Recipe,
  availableIngredients: string[]
): string[] {
  const normalizedAvailable = availableIngredients.map(normalizeIngredient)
  const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
  
  return normalizedRecipe.filter(recipeIng => {
    // Vérifier correspondance exacte ou stricte
    const hasMatch = normalizedAvailable.some(availIng => 
      ingredientsMatch(recipeIng, availIng)
    )
    
    return !hasMatch // Retourner true si pas de correspondance = ingrédient manquant
  })
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
    'tomato': 4.50,
    'garlic': 3.00,
    'olive oil': 8.00,
    'basil': 3.00,
    'mozzarella': 10.00,
    'potatoes': 3.00,
    'potato': 3.00,
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
 * Now uses database recipes first, falls back to hardcoded templates if DB is empty
 */
export async function generateRecipe(request: RecipeRequest): Promise<Recipe> {
  // Try to load from database first
  let candidates: Recipe[] = []
  
  try {
    const { loadRecipeDatasetFiltered } = await import('./datasetLoader')
    const dbRecipes = await loadRecipeDatasetFiltered({
      recipeType: request.recipeType,
      cuisineType: request.cuisineType !== 'Other' ? request.cuisineType : undefined,
      isHealthy: request.isHealthy,
    })
    
    // Convert RecipeTemplate to Recipe format
    candidates = dbRecipes.map(rt => ({
      name: rt.name,
      description: rt.description,
      ingredients: rt.ingredients,
      steps: rt.steps,
      prepTime: rt.prepTime,
      cookTime: rt.cookTime,
      servings: rt.servings,
      calories: rt.calories,
      estimatedPrice: rt.estimatedPrice,
      cuisineType: rt.cuisineType,
      recipeType: rt.recipeType,
      isHealthy: rt.isHealthy,
    }))
  } catch (error) {
    console.log('Could not load from database, using templates:', error)
  }
  
  // Fallback to hardcoded templates if database is empty
  if (candidates.length === 0) {
    candidates = RECIPE_TEMPLATES
  }
  
  // GESTION SPÉCIALE pour un seul ingrédient
  const isSingleIngredient = request.availableIngredients.length === 1
  if (isSingleIngredient && !request.canPurchase) {
    // Prioriser les recettes qui utilisent uniquement cet ingrédient
    const normalizedAvailable = request.availableIngredients.map(normalizeIngredient)
    const singleIngredientRecipes = candidates.filter(recipe => {
      // Vérifier que la recette contient l'ingrédient fourni (correspondance stricte)
      const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
      const hasMainIngredient = normalizedRecipe.some(recipeIng => 
        normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
      )
      
      if (!hasMainIngredient) return false
      
      // Vérifier que tous les ingrédients de la recette sont disponibles (correspondance stricte)
      return normalizedRecipe.every(recipeIng => {
        return normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
      })
    })
    
    // Si on trouve des recettes avec uniquement cet ingrédient, les utiliser
    if (singleIngredientRecipes.length > 0) {
      candidates = singleIngredientRecipes
      console.log(`✅ Found ${singleIngredientRecipes.length} recipes using only: ${request.availableIngredients[0]}`)
    }
  }
  
  // Filter recipes according to basic criteria
  let filteredCandidates = candidates.filter(recipe => {
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
  if (filteredCandidates.length === 0 && request.cuisineType && request.cuisineType !== 'Other') {
    filteredCandidates = candidates.filter(recipe => {
      if (recipe.recipeType !== request.recipeType) return false
      if (containsAllergens(recipe, request.allergies)) return false
      if (!matchesDietaryPreference(recipe, request.dietaryPreference)) return false
      return true
    })
  }
  
  // If still no recipe, use all recipes of the correct type (but still respect dietary preferences)
  if (filteredCandidates.length === 0) {
    filteredCandidates = candidates.filter(r => {
      if (r.recipeType !== request.recipeType) return false
      if (containsAllergens(r, request.allergies)) return false
      if (!matchesDietaryPreference(r, request.dietaryPreference)) return false
      return true
    })
  }
  
  // CRITICAL: If user cannot purchase, filter recipes STRICTLY to only those with ALL available ingredients
  // This MUST be done BEFORE calculating scores to ensure we only consider valid recipes
  if (!request.canPurchase && request.availableIngredients.length > 0) {
    const normalizedAvailable = request.availableIngredients.map(normalizeIngredient)
    
    // STRICT FILTER: Only keep recipes where ALL ingredients are available
    filteredCandidates = filteredCandidates.filter(recipe => {
      const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
      
      // Check that EVERY recipe ingredient has a match in available ingredients
      const allIngredientsMatch = normalizedRecipe.every(recipeIng => {
        return normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
      })
      
      // Only keep recipes where ALL ingredients match
      return allIngredientsMatch
    })
    
    // If no recipe matches with ALL ingredients, try recipes that use ONLY available ingredients
    // (recipes that don't require anything extra)
    if (filteredCandidates.length === 0) {
      filteredCandidates = candidates.filter(recipe => {
        if (recipe.recipeType !== request.recipeType) return false
        if (containsAllergens(recipe, request.allergies)) return false
        if (!matchesDietaryPreference(recipe, request.dietaryPreference)) return false
        
        const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
        
        // All recipe ingredients must be found in available ingredients (using strict matching)
        return normalizedRecipe.every(recipeIng => {
          return normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
        })
      })
    }
    
    // Log for debugging
    if (filteredCandidates.length === 0) {
      console.log(`⚠️  No recipes found with available ingredients: ${request.availableIngredients.join(', ')}`)
    } else {
      console.log(`✅ Found ${filteredCandidates.length} recipes matching available ingredients`)
    }
  }
  
  // Calculate scores for each recipe
  const scoredRecipes = filteredCandidates.map(recipe => {
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
  let bestMatch = scoredRecipes[0]?.recipe || filteredCandidates[0]
  
  // CRITICAL: If user cannot purchase, NEVER relax constraints - they MUST have all ingredients
  // Only relax if user can purchase
  if (!bestMatch && request.canPurchase) {
    // Try without dietary preferences filter
    filteredCandidates = candidates.filter(r => {
      if (r.recipeType !== request.recipeType) return false
      if (containsAllergens(r, request.allergies)) return false
      return true
    })
    
    if (filteredCandidates.length > 0) {
      const relaxedScored = filteredCandidates.map(recipe => {
        const similarity = cosineSimilarity(request.availableIngredients, recipe.ingredients)
        const score = calculateRecipeScore(recipe, request, similarity)
        return { recipe, score, similarity }
      })
      relaxedScored.sort((a, b) => b.score - a.score)
      bestMatch = relaxedScored[0]?.recipe || filteredCandidates[0]
    }
    
    // If still no recipe, use ANY recipe of the correct type (except allergens)
    if (!bestMatch) {
      filteredCandidates = candidates.filter(r => {
        if (r.recipeType !== request.recipeType) return false
        if (containsAllergens(r, request.allergies)) return false
        return true
      })
      bestMatch = filteredCandidates[0] || candidates[0]
    }
    
    // Last resort: use any recipe from templates
    if (!bestMatch) {
      bestMatch = RECIPE_TEMPLATES.find(r => r.recipeType === request.recipeType) || RECIPE_TEMPLATES[0]
    }
  } else if (!bestMatch && !request.canPurchase) {
    // If user cannot purchase and no recipe found, return null or throw error
    // This should not happen if filtering worked correctly, but as safety check
    console.error(`❌ CRITICAL: No recipe found with available ingredients: ${request.availableIngredients.join(', ')}`)
    // Return a recipe with suggestion note instead
    bestMatch = filteredCandidates[0] || candidates.find(r => r.recipeType === request.recipeType)
    if (bestMatch) {
      // This will be handled below with suggestionNote
    }
  }
  
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
  
  // VÉRIFICATION FINALE CRITIQUE : Si l'utilisateur ne peut pas acheter, la recette NE DOIT PAS avoir d'ingrédients manquants
  if (!request.canPurchase && missingIngredients.length > 0) {
    console.error(`❌ ERREUR: Recette "${generatedRecipe.name}" retournée avec ingrédients manquants alors que canPurchase=false`)
    console.error(`   Ingrédients disponibles: ${request.availableIngredients.join(', ')}`)
    console.error(`   Ingrédients de la recette: ${generatedRecipe.ingredients.join(', ')}`)
    console.error(`   Ingrédients manquants: ${missingIngredients.join(', ')}`)
    
    // Essayer de trouver une recette qui correspond vraiment
    const normalizedAvailable = request.availableIngredients.map(normalizeIngredient)
    const matchingRecipes = candidates.filter(recipe => {
      if (recipe.recipeType !== request.recipeType) return false
      if (containsAllergens(recipe, request.allergies)) return false
      
      const normalizedRecipe = recipe.ingredients.map(normalizeIngredient)
      return normalizedRecipe.every(recipeIng => 
        normalizedAvailable.some(availIng => ingredientsMatch(recipeIng, availIng))
      )
    })
    
    if (matchingRecipes.length > 0) {
      const correctRecipe = matchingRecipes[0]
      const correctMissing = findMissingIngredients(correctRecipe, request.availableIngredients)
      if (correctMissing.length === 0) {
        console.log(`✅ Correction: Recette "${correctRecipe.name}" correspond aux ingrédients disponibles`)
        return {
          ...correctRecipe,
          missingIngredients: [],
          estimatedPrice: 0
        }
      }
    }
    
    // Si aucune recette ne correspond, retourner une erreur avec suggestion
    generatedRecipe.suggestionNote = 
      `Aucune recette trouvée avec uniquement les ingrédients disponibles (${request.availableIngredients.join(', ')}). ` +
      `Pour préparer "${generatedRecipe.name}", vous aurez besoin des ingrédients suivants : ${missingIngredients.join(', ')}. ` +
      `Activez l'option "Je peux acheter" pour voir cette recette.`
  }
  
  // Ajouter une note informative si un seul ingrédient est fourni et que des ingrédients supplémentaires sont requis
  if (isSingleIngredient && missingIngredients.length > 0 && !request.canPurchase) {
    const mainIngredient = request.availableIngredients[0]
    generatedRecipe.suggestionNote = 
      `Pour préparer "${generatedRecipe.name}" avec seulement "${mainIngredient}", vous aurez besoin des ingrédients suivants : ${missingIngredients.join(', ')}. ` +
      `Ces ingrédients peuvent être achetés pour compléter votre recette.`
  } else if (isSingleIngredient && missingIngredients.length > 0 && request.canPurchase) {
    const mainIngredient = request.availableIngredients[0]
    generatedRecipe.suggestionNote = 
      `Recette suggérée avec "${mainIngredient}" comme ingrédient principal. ` +
      `Ingrédients supplémentaires requis : ${missingIngredients.join(', ')}.`
  }
  
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
    // If user cannot purchase, they MUST have all ingredients
    // This should already be filtered above, but double-check
    if (missingIngredients.length > 0) {
      // Try to find a recipe with available ingredients from scored recipes
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
      } else {
        // No recipe found with available ingredients - this shouldn't happen if filtering worked
        // But as fallback, return the recipe anyway but warn the user
        console.warn('Warning: Recipe with missing ingredients returned even though canPurchase=false')
        return {
          ...generatedRecipe,
          missingIngredients: [],
          estimatedPrice: 0
        }
      }
    } else {
      // No missing ingredients - perfect!
      generatedRecipe.estimatedPrice = 0
    }
  }
  
  return generatedRecipe
}

/**
 * Synchronous version for backward compatibility (uses templates only)
 * @deprecated Use async generateRecipe() instead
 */
export function generateRecipeSync(request: RecipeRequest): Recipe {
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

