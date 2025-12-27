"""
Chargeur de dataset depuis le fichier JSON statique
"""

from typing import List, Dict, Any
from database import load_recipe_templates
import json

def load_recipe_dataset() -> List[Dict[str, Any]]:
    """Charge toutes les recettes depuis le JSON"""
    try:
        print("📂 Chargement des recettes depuis le JSON...")
        recipes = load_recipe_templates()
        
        if not recipes:
            print("⚠️  Aucune recette trouvée")
            return []
        
        print(f"✅ {len(recipes)} recettes chargées")
        
        # Convertir les champs JSON si nécessaire
        for recipe in recipes:
            # Convertir ingredients si c'est une string
            if isinstance(recipe.get('ingredients'), str):
                try:
                    recipe['ingredients'] = json.loads(recipe['ingredients'])
                except:
                    recipe['ingredients'] = []
            
            # Convertir steps si c'est une string
            if isinstance(recipe.get('steps'), str):
                try:
                    recipe['steps'] = json.loads(recipe['steps'])
                except:
                    recipe['steps'] = []
        
        return recipes
    except Exception as e:
        print(f"❌ Erreur lors du chargement des recettes: {e}")
        import traceback
        traceback.print_exc()
        return []

def load_recipe_dataset_filtered(
    recipe_type: str = None,
    cuisine_type: str = None,
    is_healthy: bool = None
) -> List[Dict[str, Any]]:
    """Charge les recettes avec filtres"""
    try:
        recipes = load_recipe_dataset()
        
        if not recipes:
            print("⚠️  Aucune recette trouvée dans le dataset")
            return []
        
        filtered = []
        for recipe in recipes:
            # Filtrer par type de recette
            if recipe_type:
                recipe_recipe_type = recipe.get('recipe_type', '').lower()
                if recipe_recipe_type != recipe_type.lower():
                    continue
            
            # Filtrer par type de cuisine
            if cuisine_type:
                recipe_cuisine = recipe.get('cuisine_type', '').lower()
                if recipe_cuisine != cuisine_type.lower():
                    continue
            
            # Filtrer par santé
            if is_healthy is not None:
                recipe_is_healthy = recipe.get('is_healthy', False)
                if recipe_is_healthy != is_healthy:
                    continue
            
            filtered.append(recipe)
        
        return filtered
    except Exception as e:
        print(f"❌ Erreur lors du filtrage des recettes: {e}")
        import traceback
        traceback.print_exc()
        return []
