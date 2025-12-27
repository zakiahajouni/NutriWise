"""
API Python pour le Machine Learning de NutriWise
Utilise Flask pour servir les modèles ML
Utilise un fichier JSON statique comme base de données (pour l'hébergement)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from typing import Dict, List, Optional
import json
import random

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
CORS(app)  # Autoriser les requêtes depuis Next.js

# Imports des modules ML
from database import (
    load_recipe_templates, load_user_profile, load_user_interactions,
    activate_model
)
from dataset_loader import load_recipe_dataset, load_recipe_dataset_filtered
from feature_extractor import FeatureExtractor
from classification_model import ClassificationModel
from generation_model import GenerationModel

# Modèles ML (seront chargés à la demande)
classification_model: Optional[ClassificationModel] = None
generation_model: Optional[GenerationModel] = None
feature_extractor = FeatureExtractor()

def get_classification_model() -> Optional[ClassificationModel]:
    """Charge le modèle de classification depuis la DB si disponible"""
    global classification_model
    if classification_model is None:
        try:
            classification_model = ClassificationModel.load_from_db()
            print("✅ Modèle de classification chargé depuis la DB")
        except Exception as e:
            print(f"⚠️  Modèle de classification non disponible: {e}")
    return classification_model

def get_generation_model() -> Optional[GenerationModel]:
    """Charge le modèle de génération depuis la DB si disponible"""
    global generation_model
    if generation_model is None:
        try:
            generation_model = GenerationModel.load_from_db()
            print("✅ Modèle de génération chargé depuis la DB")
        except Exception as e:
            print(f"⚠️  Modèle de génération non disponible: {e}")
    return generation_model

@app.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'message': 'ML API is running',
        'database': 'JSON file'
    })

@app.route('/api/ml/sync-user', methods=['POST'])
def sync_user():
    """
    Synchronise un utilisateur créé dans Next.js vers le fichier JSON
    Input: { userId, email, profile: { age, gender, activity_level, dietary_preference, allergies, health_conditions } }
    """
    try:
        data = request.json
        user_id = data.get('userId')
        email = data.get('email')
        profile = data.get('profile', {})
        
        if not user_id:
            return jsonify({'error': 'userId is required'}), 400
        
        # Charger les données actuelles
        from database import load_data, save_data
        db_data = load_data()
        
        # Vérifier si l'utilisateur existe déjà
        user_profiles = db_data.get('user_profiles', [])
        existing_profile = next((p for p in user_profiles if p.get('user_id') == user_id), None)
        
        if existing_profile:
            # Mettre à jour le profil existant
            existing_profile.update({
                'age': profile.get('age'),
                'gender': profile.get('gender'),
                'activity_level': profile.get('activity_level'),
                'dietary_preference': profile.get('dietary_preference'),
                'allergies': profile.get('allergies', []),
                'health_conditions': profile.get('health_conditions', [])
            })
        else:
            # Créer un nouveau profil
            new_profile = {
                'user_id': user_id,
                'email': email,
                'age': profile.get('age'),
                'gender': profile.get('gender'),
                'activity_level': profile.get('activity_level'),
                'dietary_preference': profile.get('dietary_preference'),
                'allergies': profile.get('allergies', []),
                'health_conditions': profile.get('health_conditions', [])
            }
            user_profiles.append(new_profile)
        
        db_data['user_profiles'] = user_profiles
        save_data(db_data)
        
        return jsonify({
            'success': True,
            'message': 'User synchronized successfully',
            'userId': user_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/predict-profile', methods=['POST'])
def predict_profile():
    """
    Prédit le profil utilisateur basé sur les interactions
    Input: { userId, interactions }
    Output: { predictedPreferences, recommendedRecipes }
    """
    try:
        data = request.json
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'userId is required'}), 400
        
        # Charger les interactions depuis MySQL
        interactions = load_user_interactions(user_id)
        
        # Charger les recettes depuis MySQL
        recipes = load_recipe_templates()
        recipe_dict = {r['id']: r for r in recipes}
        
        # Analyser les interactions pour prédire les préférences
        preferred_cuisines = {}
        preferred_types = {}
        
        for interaction in interactions:
            recipe_id = interaction.get('recipe_template_id')
            if recipe_id and recipe_id in recipe_dict:
                recipe = recipe_dict[recipe_id]
                cuisine = recipe.get('cuisine_type', 'Other')
                recipe_type = recipe.get('recipe_type', 'savory')
                
                preferred_cuisines[cuisine] = preferred_cuisines.get(cuisine, 0) + 1
                preferred_types[recipe_type] = preferred_types.get(recipe_type, 0) + 1
        
        # Recommander des recettes similaires
        recommended_recipes = []
        if preferred_cuisines:
            top_cuisine = max(preferred_cuisines.items(), key=lambda x: x[1])[0]
            top_type = max(preferred_types.items(), key=lambda x: x[1])[0] if preferred_types else 'savory'
            
            for recipe in recipes:
                if recipe.get('cuisine_type') == top_cuisine and recipe.get('recipe_type') == top_type:
                    recommended_recipes.append({
                        'id': recipe['id'],
                        'name': recipe['name'],
                        'description': recipe.get('description', ''),
                        'cuisineType': recipe.get('cuisine_type'),
                        'recipeType': recipe.get('recipe_type'),
                    })
                    if len(recommended_recipes) >= 5:
                        break
        
        return jsonify({
            'success': True,
            'predictedPreferences': {
                'preferredCuisines': list(preferred_cuisines.keys())[:3],
                'preferredTypes': list(preferred_types.keys()),
            },
            'recommendedRecipes': recommended_recipes[:5]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/suggest-recipes', methods=['POST'])
def suggest_recipes():
    """
    Suggère des recettes basées sur le profil utilisateur
    Input: { userId, profile }
    Output: { suggestions: [recipes] }
    """
    try:
        data = request.json
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({'error': 'userId is required'}), 400
        
        # Charger le profil depuis MySQL
        db_profile = load_user_profile(user_id)
        
        if not db_profile:
            return jsonify({
                'success': True,
                'suggestions': [],
                'message': 'No profile found'
            })
        
        # Parser les allergies
        allergies = db_profile.get('allergies', [])
        if isinstance(allergies, str):
            try:
                allergies = json.loads(allergies)
            except:
                allergies = []
        
        dietary_preference = db_profile.get('dietary_preference', 'normal')
        is_healthy = dietary_preference in ['healthy', 'vegetarian', 'vegan']
        
        # Charger les recettes depuis MySQL
        recipes = load_recipe_templates()
        suggestions = []
        
        for recipe in recipes:
            # Filtrer selon les allergies
            recipe_ingredients = recipe.get('ingredients', [])
            if isinstance(recipe_ingredients, str):
                try:
                    recipe_ingredients = json.loads(recipe_ingredients)
                except:
                    recipe_ingredients = []
            
            has_allergen = any(
                allergen.lower() in ' '.join(recipe_ingredients).lower() 
                for allergen in allergies
            )
            
            if has_allergen:
                continue
            
            # Filtrer selon les préférences alimentaires
            if dietary_preference in ['vegetarian', 'vegan']:
                meat_ingredients = ['chicken', 'beef', 'pork', 'fish', 'meat', 'bacon', 'sausage']
                if any(meat in ' '.join(recipe_ingredients).lower() for meat in meat_ingredients):
                    continue
            
            # Score de correspondance
            score = 0
            if recipe.get('is_healthy') == is_healthy:
                score += 10
            if recipe.get('recipe_type') == 'savory':
                score += 5
            
            suggestions.append({
                'id': recipe['id'],
                'name': recipe['name'],
                'description': recipe.get('description', ''),
                'cuisineType': recipe.get('cuisine_type'),
                'recipeType': recipe.get('recipe_type'),
                'score': score,
                'matchReason': f'Matches your {dietary_preference} preference'
            })
        
        # Trier par score et retourner les meilleures
        suggestions.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions[:3]  # Top 3
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/generate-meal', methods=['POST'])
def generate_meal():
    """
    Génère une recette personnalisée basée sur les ingrédients disponibles
    Input: { recipeType, availableIngredients, allergies, dietaryPreference, ... }
    Output: { recipe }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        recipe_type = data.get('recipeType', 'savory')
        available_ingredients = data.get('availableIngredients', [])
        allergies = data.get('allergies', [])
        dietary_preference = data.get('dietaryPreference', 'normal')
        cuisine_type = data.get('cuisineType', 'Other')
        is_healthy = data.get('isHealthy', False)
        
        print(f"🔍 Génération de recette - Type: {recipe_type}, Ingrédients: {len(available_ingredients)}, Allergies: {allergies}")
        
        # Essayer d'utiliser le modèle ML si disponible
        model = get_generation_model()
        
        if model:
            try:
                # Charger les recettes pour construire les features
                recipes = load_recipe_dataset()
                if recipes:
                    feature_extractor = FeatureExtractor()
                    feature_extractor.build_vocabularies(recipes)
                    stats = feature_extractor.calculate_dataset_stats(recipes)
                    
                    # Extraire les features
                    user_features = feature_extractor.extract_user_request_features(
                        available_ingredients,
                        recipe_type,
                        cuisine_type,
                        is_healthy,
                        allergies,
                        stats
                    )
                    
                    # Prédire avec le modèle
                    predictions = model.predict(user_features, top_k=5)
                    
                    if predictions:
                        # Charger la recette recommandée
                        recipe_id = predictions[0]['recipeId']
                        if recipe_id < len(recipes):
                            best_recipe = recipes[recipe_id]
                            
                            # Trouver les ingrédients manquants
                            recipe_ingredients = best_recipe.get('ingredients', [])
                            if isinstance(recipe_ingredients, str):
                                try:
                                    recipe_ingredients = json.loads(recipe_ingredients)
                                except:
                                    recipe_ingredients = []
                            
                            missing_ingredients = [
                                ing for ing in recipe_ingredients
                                if not any(
                                    av.lower() in ing.lower() or ing.lower() in av.lower()
                                    for av in available_ingredients
                                )
                            ]
                            
                            return jsonify({
                                'name': best_recipe['name'],
                                'description': best_recipe.get('description', ''),
                                'ingredients': recipe_ingredients,
                                'steps': best_recipe.get('steps', []),
                                'prepTime': best_recipe.get('prep_time', 15),
                                'cookTime': best_recipe.get('cook_time', 30),
                                'servings': best_recipe.get('servings', 4),
                                'calories': best_recipe.get('calories', 300),
                                'estimatedPrice': best_recipe.get('estimated_price', 10.0),
                                'missingIngredients': missing_ingredients,
                                'cuisineType': best_recipe.get('cuisine_type', 'Other'),
                                'recipeType': best_recipe.get('recipe_type', 'savory'),
                                'isHealthy': best_recipe.get('is_healthy', False),
                            })
            except Exception as e:
                print(f"⚠️  Erreur avec le modèle ML, utilisation du fallback: {e}")
                import traceback
                traceback.print_exc()
        
        # Fallback: algorithme de similarité simple
        print("📊 Utilisation de l'algorithme de fallback...")
        try:
            recipes = load_recipe_dataset_filtered(recipe_type=recipe_type)
            print(f"✅ {len(recipes)} recettes chargées pour le type {recipe_type}")
        except Exception as e:
            print(f"❌ Erreur lors du chargement des recettes: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error loading recipes: {str(e)}'}), 500
        
        matching_recipes = []
        
        for recipe in recipes:
            # Vérifier les allergies
            recipe_ingredients = recipe.get('ingredients', [])
            if isinstance(recipe_ingredients, str):
                try:
                    recipe_ingredients = json.loads(recipe_ingredients)
                except:
                    recipe_ingredients = []
            
            has_allergen = any(
                allergen.lower() in ' '.join(recipe_ingredients).lower() 
                for allergen in allergies
            )
            if has_allergen:
                continue
            
            # Vérifier les préférences alimentaires
            if dietary_preference in ['vegetarian', 'vegan']:
                meat_ingredients = ['chicken', 'beef', 'pork', 'fish', 'meat', 'bacon', 'sausage']
                if any(meat in ' '.join(recipe_ingredients).lower() for meat in meat_ingredients):
                    continue
            
            # Calculer la similarité
            recipe_ingredients_lower = [ing.lower() for ing in recipe_ingredients]
            available_lower = [ing.lower() for ing in available_ingredients]
            
            matches = sum(
                1 for ing in recipe_ingredients_lower
                if any(av in ing or ing in av for av in available_lower)
            )
            similarity = matches / len(recipe_ingredients) if recipe_ingredients else 0
            
            missing_ingredients = [
                ing for ing in recipe_ingredients
                if not any(
                    av.lower() in ing.lower() or ing.lower() in av.lower()
                    for av in available_ingredients
                )
            ]
            
            matching_recipes.append({
                **recipe,
                'similarity': similarity,
                'missingIngredients': missing_ingredients
            })
        
        # Trier par similarité et sélectionner la meilleure
        print(f"🔍 {len(matching_recipes)} recettes correspondantes trouvées")
        
        if matching_recipes:
            matching_recipes.sort(key=lambda x: x['similarity'], reverse=True)
            
            # Sélectionner aléatoirement parmi les top N recettes pour plus de variété
            # Prendre les 10 meilleures recettes (ou moins s'il y en a moins)
            top_n = min(10, len(matching_recipes))
            top_recipes = matching_recipes[:top_n]
            
            # Si plusieurs recettes ont la même similarité maximale, randomiser parmi elles
            max_similarity = top_recipes[0]['similarity']
            recipes_with_max_similarity = [
                r for r in top_recipes 
                if abs(r['similarity'] - max_similarity) < 0.01  # Tolérance pour les similarités égales
            ]
            
            # Sélectionner aléatoirement parmi les recettes avec la meilleure similarité
            if len(recipes_with_max_similarity) > 1:
                best_recipe = random.choice(recipes_with_max_similarity)
                print(f"🎲 Sélection aléatoire parmi {len(recipes_with_max_similarity)} recettes avec similarité {max_similarity:.3f}")
            else:
                # Sinon, sélectionner aléatoirement parmi les top N
                best_recipe = random.choice(top_recipes)
                print(f"🎲 Sélection aléatoire parmi les {top_n} meilleures recettes")
            
            recipe_ingredients = best_recipe.get('ingredients', [])
            if isinstance(recipe_ingredients, str):
                try:
                    recipe_ingredients = json.loads(recipe_ingredients)
                except:
                    recipe_ingredients = []
            
            recipe_steps = best_recipe.get('steps', [])
            if isinstance(recipe_steps, str):
                try:
                    recipe_steps = json.loads(recipe_steps)
                except:
                    recipe_steps = []
            
            print(f"✅ Recette sélectionnée: {best_recipe.get('name')}")
            
            return jsonify({
                'name': best_recipe['name'],
                'description': best_recipe.get('description', ''),
                'ingredients': recipe_ingredients,
                'steps': recipe_steps,
                'prepTime': best_recipe.get('prep_time', 15),
                'cookTime': best_recipe.get('cook_time', 30),
                'servings': best_recipe.get('servings', 4),
                'calories': best_recipe.get('calories', 300),
                'estimatedPrice': best_recipe.get('estimated_price', 10.0),
                'missingIngredients': best_recipe.get('missingIngredients', []),
                'cuisineType': best_recipe.get('cuisine_type', 'Other'),
                'recipeType': best_recipe.get('recipe_type', 'savory'),
                'isHealthy': best_recipe.get('is_healthy', False),
            })
        else:
            # Recette par défaut si aucune correspondance
            print("⚠️  Aucune recette correspondante, utilisation de la recette par défaut")
            return jsonify({
                'name': 'Simple Pasta',
                'description': 'A simple and delicious pasta dish',
                'ingredients': ['pasta', 'olive oil', 'garlic', 'salt', 'pepper'],
                'steps': [
                    'Cook pasta according to package instructions',
                    'Heat olive oil in a pan',
                    'Add garlic and cook until fragrant',
                    'Toss pasta with oil and garlic',
                    'Season with salt and pepper'
                ],
                'prepTime': 10,
                'cookTime': 15,
                'servings': 4,
                'calories': 350,
                'estimatedPrice': 8.0,
                'missingIngredients': [],
                'cuisineType': 'Italian',
                'recipeType': recipe_type,
                'isHealthy': False,
            })
        
    except Exception as e:
        print(f"❌ Erreur lors de la génération de recette: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'details': traceback.format_exc() if os.getenv('FLASK_DEBUG') else None}), 500

@app.route('/api/ml/train-classification', methods=['POST'])
def train_classification():
    """Entraîne le modèle de classification"""
    try:
        data = request.json or {}
        
        # Créer et entraîner le modèle
        model = ClassificationModel()
        
        metrics = model.train(
            epochs=data.get('epochs', 200),
            batch_size=data.get('batchSize', 128),
            validation_split=data.get('validationSplit', 0.15),
            hidden_layers=data.get('hiddenLayers', [512, 512, 256, 128, 64]),
            learning_rate=data.get('learningRate', 0.0004),
            dropout=data.get('dropout', 0.4)
        )
        
        # Sauvegarder le modèle
        model_id = model.save()
        
        # Activer le modèle
        activate_model(model_id, 'recipe_classification')
        
        return jsonify({
            'success': True,
            'message': 'Classification model trained successfully',
            'modelId': model_id,
            'metrics': metrics
        })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/ml/train-generation', methods=['POST'])
def train_generation():
    """Entraîne le modèle de génération"""
    try:
        data = request.json or {}
        
        # Créer et entraîner le modèle
        model = GenerationModel()
        
        metrics = model.train(
            epochs=data.get('epochs', 150),
            batch_size=data.get('batchSize', 64),
            hidden_layers=data.get('hiddenLayers', [512, 256, 128, 64]),
            learning_rate=data.get('learningRate', 0.0003),
            dropout=data.get('dropout', 0.35)
        )
        
        # Sauvegarder le modèle
        model_id = model.save()
        
        # Activer le modèle
        activate_model(model_id, 'recipe_generation')
        
        return jsonify({
            'success': True,
            'message': 'Generation model trained successfully',
            'modelId': model_id,
            'metrics': metrics
        })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
