"""
Script pour initialiser le fichier data.json avec les recettes du dataset
"""

import json
from pathlib import Path

def init_data_from_dataset():
    """Initialise data.json avec les recettes du dataset"""
    # Chemin vers le dataset
    dataset_path = Path(__file__).parent.parent / 'data' / 'recipes_dataset.json'
    data_path = Path(__file__).parent / 'data.json'
    
    if not dataset_path.exists():
        print(f"⚠️  Dataset non trouvé: {dataset_path}")
        return
    
    # Charger le dataset
    with open(dataset_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    
    # Créer la structure de données
    recipes = dataset.get('recipes', [])
    
    # Normaliser les noms de champs pour correspondre à la structure attendue
    normalized_recipes = []
    for recipe in recipes:
        normalized = {
            'id': recipe.get('id'),
            'name': recipe.get('name'),
            'description': recipe.get('description', ''),
            'ingredients': recipe.get('ingredients', []),
            'steps': recipe.get('steps', []),
            'prep_time': recipe.get('prepTime', recipe.get('prep_time', 15)),
            'cook_time': recipe.get('cookTime', recipe.get('cook_time', 30)),
            'servings': recipe.get('servings', 4),
            'calories': recipe.get('calories', 300),
            'estimated_price': recipe.get('estimatedPrice', recipe.get('estimated_price', 10.0)),
            'cuisine_type': recipe.get('cuisine', recipe.get('cuisine_type', 'Other')),
            'recipe_type': recipe.get('recipeType', recipe.get('recipe_type', 'savory')),
            'is_healthy': recipe.get('isHealthy', recipe.get('is_healthy', False)),
            'difficulty_level': recipe.get('difficulty', recipe.get('difficulty_level', 'medium')),
            'tags': recipe.get('tags', [])
        }
        normalized_recipes.append(normalized)
    
    # Charger les données existantes pour préserver les utilisateurs et modèles
    if data_path.exists():
        with open(data_path, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = {
            'user_profiles': [],
            'interactions': [],
            'ml_models': []
        }
    
    # Créer la structure complète en préservant les données existantes
    data = {
        'recipes': normalized_recipes,
        'user_profiles': existing_data.get('user_profiles', []),
        'interactions': existing_data.get('interactions', []),
        'ml_models': existing_data.get('ml_models', [])
    }
    
    # Sauvegarder
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {len(normalized_recipes)} recettes chargées dans {data_path}")
    print(f"✅ {len(data['user_profiles'])} utilisateurs préservés")
    print(f"✅ {len(data['ml_models'])} modèles préservés")

if __name__ == '__main__':
    init_data_from_dataset()

