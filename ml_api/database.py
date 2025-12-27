"""
Module de gestion de base de données JSON statique
Utilise un fichier JSON pour l'hébergement (plus simple que MySQL)
"""

import json
from pathlib import Path
from typing import Optional, List, Dict, Any
import threading
from contextlib import contextmanager

# Chemin vers le fichier JSON
DATA_FILE = Path(__file__).parent / 'data.json'
_lock = threading.Lock()  # Pour la sécurité des threads lors de l'écriture

def ensure_data_file():
    """Crée le fichier JSON avec structure par défaut s'il n'existe pas"""
    if not DATA_FILE.exists():
        default_data = {
            "recipes": [],
            "user_profiles": [],
            "interactions": [],
            "ml_models": []
        }
        save_data(default_data)

def load_data() -> Dict[str, Any]:
    """Charge les données depuis le fichier JSON"""
    ensure_data_file()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Créer le fichier avec des données par défaut
        default_data = {
            "recipes": [],
            "user_profiles": [],
            "interactions": [],
            "ml_models": []
        }
        save_data(default_data)
        return default_data

def save_data(data: Dict[str, Any]) -> None:
    """Sauvegarde les données dans le fichier JSON"""
    with _lock:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

class Database:
    """Gestionnaire de base de données JSON"""
    
    @staticmethod
    @contextmanager
    def get_connection():
        """Context manager pour compatibilité"""
        data = load_data()
        yield data
        # Les modifications sont sauvegardées explicitement
    
    @staticmethod
    def execute_query(query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """Exécute une requête SELECT simulée"""
        data = load_data()
        
        # Simuler des requêtes SQL simples
        if 'recipe_templates' in query.lower() or 'recipes' in query.lower():
            return data.get('recipes', [])
        elif 'user_profiles' in query.lower():
            user_id = params[0] if params else None
            profiles = data.get('user_profiles', [])
            if user_id:
                return [p for p in profiles if p.get('user_id') == user_id]
            return profiles
        elif 'user_interactions' in query.lower() or 'interactions' in query.lower():
            user_id = params[0] if params else None
            interactions = data.get('interactions', [])
            if user_id:
                return [i for i in interactions if i.get('user_id') == user_id]
            return interactions
        elif 'ml_models' in query.lower():
            model_name = params[0] if params else None
            models = data.get('ml_models', [])
            if model_name:
                return [m for m in models if m.get('model_name') == model_name and m.get('is_active', False)]
            return models
        
        return []
    
    @staticmethod
    def execute_update(query: str, params: tuple = None) -> int:
        """Exécute une requête INSERT/UPDATE simulée"""
        data = load_data()
        last_id = 0
        
        if 'INSERT INTO ml_models' in query.upper():
            # Ajouter un modèle
            models = data.get('ml_models', [])
            last_id = len(models) + 1
            
            model_data = {
                'id': last_id,
                'model_name': params[0],
                'model_type': params[1],
                'model_version': params[2],
                'model_data': params[3].decode('latin-1') if isinstance(params[3], bytes) else params[3],  # Stocker en string
                'model_metadata': json.loads(params[4]) if isinstance(params[4], str) else params[4],
                'training_data_size': params[5],
                'is_active': bool(params[6]),
                'created_at': None  # Peut être ajouté si nécessaire
            }
            
            models.append(model_data)
            data['ml_models'] = models
            save_data(data)
        
        elif 'UPDATE ml_models' in query.upper():
            # Mettre à jour un modèle
            models = data.get('ml_models', [])
            model_name = params[0] if params else None
            
            if model_name:
                for model in models:
                    if model.get('model_name') == model_name:
                        if 'is_active' in query.upper():
                            model['is_active'] = bool(params[1] if len(params) > 1 else False)
                        else:
                            # Mise à jour complète
                            if len(params) > 3:
                                model['model_data'] = params[3].decode('latin-1') if isinstance(params[3], bytes) else params[3]
                                model['model_metadata'] = json.loads(params[4]) if isinstance(params[4], str) else params[4]
                                model['training_data_size'] = params[5]
                        break
            
            data['ml_models'] = models
            save_data(data)
        
        return last_id

# Fonctions utilitaires pour charger les données
def load_recipe_templates() -> List[Dict[str, Any]]:
    """Charge toutes les recettes depuis le JSON"""
    try:
        data = load_data()
        recipes = data.get('recipes', [])
        if not recipes:
            print("⚠️  Aucune recette dans le fichier JSON")
        return recipes
    except Exception as e:
        print(f"❌ Erreur lors du chargement des recettes depuis JSON: {e}")
        import traceback
        traceback.print_exc()
        return []

def load_user_profile(user_id: int) -> Optional[Dict[str, Any]]:
    """Charge le profil d'un utilisateur"""
    data = load_data()
    profiles = data.get('user_profiles', [])
    for profile in profiles:
        if profile.get('user_id') == user_id:
            return profile
    return None

def load_user_interactions(user_id: int, limit: int = 10000) -> List[Dict[str, Any]]:
    """Charge les interactions d'un utilisateur"""
    data = load_data()
    interactions = data.get('interactions', [])
    user_interactions = [
        i for i in interactions 
        if i.get('user_id') == user_id and i.get('recipe_template_id') is not None
    ]
    return user_interactions[:limit]

def save_model_to_db(
    model_name: str,
    model_type: str,
    model_version: str,
    model_data: bytes,
    metadata: Dict[str, Any],
    training_data_size: int = 0,
    is_active: bool = False
) -> int:
    """Sauvegarde un modèle ML dans le JSON"""
    data = load_data()
    models = data.get('ml_models', [])
    
    # Trouver le dernier ID
    last_id = max([m.get('id', 0) for m in models], default=0) + 1
    
    # Convertir les bytes en string pour JSON
    if isinstance(model_data, bytes):
        import base64
        model_data_str = base64.b64encode(model_data).decode('utf-8')
    else:
        model_data_str = model_data
    
    model_entry = {
        'id': last_id,
        'model_name': model_name,
        'model_type': model_type,
        'model_version': model_version,
        'model_data': model_data_str,  # Stocké en base64
        'model_metadata': metadata,
        'training_data_size': training_data_size,
        'is_active': is_active
    }
    
    # Désactiver les autres modèles du même type
    if is_active:
        for model in models:
            if model.get('model_name') == model_name:
                model['is_active'] = False
    
    models.append(model_entry)
    data['ml_models'] = models
    save_data(data)
    
    return last_id

def load_model_from_db(model_name: str, model_version: str = 'latest') -> Optional[Dict[str, Any]]:
    """Charge un modèle depuis le JSON"""
    data = load_data()
    models = data.get('ml_models', [])
    
    if model_version == 'latest':
        # Trouver le modèle actif le plus récent
        active_models = [
            m for m in models 
            if m.get('model_name') == model_name and m.get('is_active', False)
        ]
        if active_models:
            # Trier par ID (le plus récent)
            active_models.sort(key=lambda x: x.get('id', 0), reverse=True)
            return active_models[0]
    else:
        # Trouver le modèle avec la version spécifiée
        for model in models:
            if model.get('model_name') == model_name and model.get('model_version') == model_version:
                return model
    
    return None

def activate_model(model_id: int, model_name: str) -> None:
    """Active un modèle et désactive les autres du même type"""
    data = load_data()
    models = data.get('ml_models', [])
    
    # Désactiver tous les modèles du même nom
    for model in models:
        if model.get('model_name') == model_name:
            model['is_active'] = False
    
    # Activer le modèle spécifié
    for model in models:
        if model.get('id') == model_id:
            model['is_active'] = True
            break
    
    data['ml_models'] = models
    save_data(data)
