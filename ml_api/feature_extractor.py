"""
Extraction de features pour les modèles ML
Convertit les données brutes en vecteurs numériques
"""

from typing import List, Dict, Any, Optional
import json

class FeatureExtractor:
    """Extracteur de features pour les modèles ML"""
    
    def __init__(self):
        self.ingredient_vocabulary: Dict[str, int] = {}
        self.cuisine_types: Dict[str, int] = {}
        self.stats: Optional[Dict[str, float]] = None
    
    def build_vocabularies(self, recipes: List[Dict[str, Any]]) -> None:
        """Construit les vocabulaires d'ingrédients et de cuisines"""
        ingredient_set = set()
        cuisine_set = set()
        
        for recipe in recipes:
            # Ingredients
            ingredients = recipe.get('ingredients', [])
            if isinstance(ingredients, str):
                ingredients = json.loads(ingredients)
            
            for ing in ingredients:
                ingredient_set.add(ing.lower().strip())
            
            # Cuisines
            cuisine = recipe.get('cuisine_type', 'Other')
            cuisine_set.add(cuisine.lower())
        
        # Créer les dictionnaires
        self.ingredient_vocabulary = {
            ing: idx for idx, ing in enumerate(sorted(ingredient_set))
        }
        self.cuisine_types = {
            cuisine: idx for idx, cuisine in enumerate(sorted(cuisine_set))
        }
    
    def calculate_dataset_stats(self, recipes: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calcule les statistiques du dataset pour la normalisation"""
        calories = []
        prices = []
        prep_times = []
        cook_times = []
        
        for recipe in recipes:
            if recipe.get('calories'):
                calories.append(float(recipe['calories']))
            if recipe.get('estimated_price'):
                prices.append(float(recipe['estimated_price']))
            if recipe.get('prep_time'):
                prep_times.append(float(recipe['prep_time']))
            if recipe.get('cook_time'):
                cook_times.append(float(recipe['cook_time']))
        
        self.stats = {
            'minCalories': min(calories) if calories else 0,
            'maxCalories': max(calories) if calories else 1000,
            'minPrice': min(prices) if prices else 0,
            'maxPrice': max(prices) if prices else 50,
            'minPrepTime': min(prep_times) if prep_times else 0,
            'maxPrepTime': max(prep_times) if prep_times else 180,
            'minCookTime': min(cook_times) if cook_times else 0,
            'maxCookTime': max(cook_times) if cook_times else 180,
        }
        
        return self.stats
    
    def normalize(self, value: float, min_val: float, max_val: float) -> float:
        """Normalise une valeur entre 0 et 1"""
        if max_val == min_val:
            return 0.5
        return (value - min_val) / (max_val - min_val)
    
    def extract_user_request_features(
        self,
        available_ingredients: List[str],
        recipe_type: str,
        cuisine_type: str,
        is_healthy: bool,
        allergies: List[str],
        stats: Optional[Dict[str, float]] = None
    ) -> List[float]:
        """Extrait les features d'une requête utilisateur"""
        if stats is None:
            stats = self.stats or {}
        
        features = []
        
        # Encodage one-hot des ingrédients disponibles
        vocab_size = len(self.ingredient_vocabulary) or 100
        ingredient_vector = [0.0] * vocab_size
        
        for ing in available_ingredients:
            idx = self.ingredient_vocabulary.get(ing.lower().strip())
            if idx is not None:
                ingredient_vector[idx] = 1.0
        
        features.extend(ingredient_vector)
        
        # Type de recette (0 = sweet, 1 = savory)
        features.append(0.0 if recipe_type == 'sweet' else 1.0)
        
        # Type de cuisine (one-hot)
        cuisine_size = len(self.cuisine_types) or 10
        cuisine_vector = [0.0] * cuisine_size
        cuisine_idx = self.cuisine_types.get(cuisine_type.lower())
        if cuisine_idx is not None:
            cuisine_vector[cuisine_idx] = 1.0
        features.extend(cuisine_vector)
        
        # Préférence santé
        features.append(1.0 if is_healthy else 0.0)
        
        # Allergies (vecteur de pénalités)
        common_allergens = ['nuts', 'peanuts', 'shellfish', 'fish', 'eggs', 
                           'milk', 'soy', 'wheat', 'gluten', 'sesame']
        allergen_vector = [0.0] * len(common_allergens)
        for i, allergen in enumerate(common_allergens):
            if allergen.lower() in [a.lower() for a in allergies]:
                allergen_vector[i] = -1.0  # Pénalité
        features.extend(allergen_vector)
        
        return features
    
    def extract_recipe_features(
        self,
        recipe: Dict[str, Any],
        stats: Optional[Dict[str, float]] = None
    ) -> List[float]:
        """Extrait les features d'une recette"""
        if stats is None:
            stats = self.stats or {}
        
        features = []
        
        # Encodage one-hot des ingrédients
        vocab_size = len(self.ingredient_vocabulary) or 100
        ingredient_vector = [0.0] * vocab_size
        
        ingredients = recipe.get('ingredients', [])
        if isinstance(ingredients, str):
            ingredients = json.loads(ingredients)
        
        for ing in ingredients:
            idx = self.ingredient_vocabulary.get(ing.lower().strip())
            if idx is not None:
                ingredient_vector[idx] = 1.0
        
        features.extend(ingredient_vector)
        
        # Type de recette
        recipe_type = recipe.get('recipe_type', 'savory')
        features.append(0.0 if recipe_type == 'sweet' else 1.0)
        
        # Type de cuisine
        cuisine_size = len(self.cuisine_types) or 10
        cuisine_vector = [0.0] * cuisine_size
        cuisine = recipe.get('cuisine_type', 'Other')
        cuisine_idx = self.cuisine_types.get(cuisine.lower())
        if cuisine_idx is not None:
            cuisine_vector[cuisine_idx] = 1.0
        features.extend(cuisine_vector)
        
        # Features numériques normalisées
        calories = float(recipe.get('calories', 0))
        price = float(recipe.get('estimated_price', 0))
        prep_time = float(recipe.get('prep_time', 0))
        cook_time = float(recipe.get('cook_time', 0))
        
        features.append(self.normalize(calories, stats.get('minCalories', 0), stats.get('maxCalories', 1000)))
        features.append(self.normalize(price, stats.get('minPrice', 0), stats.get('maxPrice', 50)))
        features.append(self.normalize(prep_time, stats.get('minPrepTime', 0), stats.get('maxPrepTime', 180)))
        features.append(self.normalize(cook_time, stats.get('minCookTime', 0), stats.get('maxCookTime', 180)))
        
        # Santé
        features.append(1.0 if recipe.get('is_healthy', False) else 0.0)
        
        return features

