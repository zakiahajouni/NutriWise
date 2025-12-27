"""
Modèle de génération pour création de recettes personnalisées
Utilise TensorFlow/Keras pour générer des recettes basées sur les ingrédients disponibles
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, callbacks
from typing import Dict, List, Tuple, Optional, Any
import json
from database import save_model_to_db, activate_model, load_model_from_db
from feature_extractor import FeatureExtractor
from dataset_loader import load_recipe_dataset

class GenerationModel:
    """Modèle de génération pour création de recettes"""
    
    def __init__(self):
        self.model: Optional[keras.Model] = None
        self.feature_extractor = FeatureExtractor()
        self.recipes: List[Dict[str, Any]] = []
    
    def create_model(
        self,
        input_size: int,
        output_size: int,
        hidden_layers: List[int] = [512, 256, 128, 64],
        learning_rate: float = 0.0003,
        dropout: float = 0.35
    ) -> keras.Model:
        """Crée un modèle de génération"""
        model = keras.Sequential()
        
        # Input layer
        model.add(layers.Dense(
            hidden_layers[0],
            input_shape=(input_size,),
            activation='relu',
            kernel_initializer='he_normal',
            kernel_regularizer=keras.regularizers.l2(0.0001),
            name='input_layer'
        ))
        model.add(layers.BatchNormalization(name='bn_input'))
        
        # Hidden layers
        for i, units in enumerate(hidden_layers[1:], 1):
            model.add(layers.Dense(
                units,
                activation='relu',
                kernel_initializer='he_normal',
                kernel_regularizer=keras.regularizers.l2(0.0001),
                name=f'hidden_layer_{i}'
            ))
            model.add(layers.BatchNormalization(name=f'bn_{i}'))
            model.add(layers.Dropout(dropout, name=f'dropout_{i}'))
        
        # Output layer
        model.add(layers.Dense(
            output_size,
            activation='softmax',
            kernel_initializer='glorot_uniform',
            name='output_layer'
        ))
        
        # Compiler
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        return model
    
    def prepare_training_data(
        self,
        recipes: List[Dict[str, Any]]
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Prépare les données d'entraînement pour la génération"""
        # Construire les vocabulaires
        self.feature_extractor.build_vocabularies(recipes)
        stats = self.feature_extractor.calculate_dataset_stats(recipes)
        
        features = []
        labels = []
        
        # Pour chaque recette, créer plusieurs exemples avec différents sous-ensembles d'ingrédients
        examples_per_recipe = max(5, 8000 // len(recipes))
        
        for recipe in recipes:
            ingredients = recipe.get('ingredients', [])
            if isinstance(ingredients, str):
                ingredients = json.loads(ingredients)
            
            for i in range(examples_per_recipe):
                # Varier le ratio d'ingrédients disponibles (30-90%)
                available_ratio = 0.3 + np.random.random() * 0.6
                num_available = max(1, int(len(ingredients) * available_ratio))
                
                # Sélectionner aléatoirement les ingrédients disponibles
                shuffled = ingredients.copy()
                np.random.shuffle(shuffled)
                available_ingredients = shuffled[:num_available]
                
                # Parfois ajouter du bruit (10% de chance)
                if np.random.random() < 0.1 and len(recipes) > 1:
                    other_recipe = np.random.choice(recipes)
                    other_ingredients = other_recipe.get('ingredients', [])
                    if isinstance(other_ingredients, str):
                        other_ingredients = json.loads(other_ingredients)
                    if other_recipe['id'] != recipe['id'] and other_ingredients:
                        noise_ingredient = np.random.choice(other_ingredients)
                        if noise_ingredient not in available_ingredients:
                            available_ingredients.append(noise_ingredient)
                
                # Extraire les features
                user_features = self.feature_extractor.extract_user_request_features(
                    available_ingredients,
                    recipe.get('recipe_type', 'savory'),
                    recipe.get('cuisine_type', 'Other'),
                    recipe.get('is_healthy', False),
                    [],
                    stats
                )
                
                features.append(user_features)
                labels.append(recipes.index(recipe))
        
        # Convertir en numpy arrays
        X = np.array(features)
        y = np.array(labels)
        
        # One-hot encoding
        y_one_hot = keras.utils.to_categorical(y, num_classes=len(recipes))
        
        # Split train/validation/test (70/15/15)
        n = len(X)
        train_end = int(n * 0.7)
        val_end = train_end + int(n * 0.15)
        
        X_train = X[:train_end]
        y_train = y_one_hot[:train_end]
        X_val = X[train_end:val_end]
        y_val = y_one_hot[train_end:val_end]
        X_test = X[val_end:]
        y_test = y_one_hot[val_end:]
        
        return X_train, y_train, X_val, y_val, X_test, y_test
    
    def train(
        self,
        epochs: int = 150,
        batch_size: int = 64,
        hidden_layers: List[int] = [512, 256, 128, 64],
        learning_rate: float = 0.0003,
        dropout: float = 0.35
    ) -> Dict[str, Any]:
        """Entraîne le modèle de génération"""
        # Charger les recettes
        recipes = load_recipe_dataset()
        self.recipes = recipes
        
        if len(recipes) < 100:
            raise ValueError(f"Dataset trop petit ({len(recipes)} recettes). Minimum 100 requis pour la génération.")
        
        # Préparer les données
        X_train, y_train, X_val, y_val, X_test, y_test = self.prepare_training_data(recipes)
        
        # Créer le modèle
        input_size = X_train.shape[1]
        output_size = len(recipes)
        model = self.create_model(input_size, output_size, hidden_layers, learning_rate, dropout)
        
        # Callbacks
        early_stopping = callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True
        )
        
        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7
        )
        
        # Entraîner
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stopping, reduce_lr],
            verbose=1
        )
        
        # Évaluer
        test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
        
        # Calculer métriques supplémentaires
        y_pred = model.predict(X_test, verbose=0)
        y_pred_classes = np.argmax(y_pred, axis=1)
        y_true_classes = np.argmax(y_test, axis=1)
        
        from sklearn.metrics import f1_score
        ingredient_f1 = f1_score(y_true_classes, y_pred_classes, average='macro', zero_division=0)
        
        # Calculer MAE pour le prix (simplifié)
        price_mae = 0.0
        for i, true_idx in enumerate(y_true_classes):
            pred_idx = y_pred_classes[i]
            if true_idx < len(recipes) and pred_idx < len(recipes):
                true_price = float(recipes[true_idx].get('estimated_price', 0))
                pred_price = float(recipes[pred_idx].get('estimated_price', 0))
                price_mae += abs(true_price - pred_price)
        price_mae /= len(y_test)
        
        metrics = {
            'recipeAccuracy': float(test_accuracy),
            'ingredientF1': float(ingredient_f1),
            'priceMAE': float(price_mae),
            'loss': float(test_loss)
        }
        
        self.model = model
        return metrics
    
    def save(self, model_version: str = None) -> int:
        """Sauvegarde le modèle dans le fichier JSON"""
        if self.model is None:
            raise ValueError("Aucun modèle à sauvegarder")
        
        if model_version is None:
            import time
            model_version = f"generation_v{int(time.time())}"
        
        # Sérialiser le modèle
        import tempfile
        import os
        import zipfile
        
        with tempfile.TemporaryDirectory() as tmpdir:
            model_path = os.path.join(tmpdir, 'model')
            self.model.save(model_path)
            
            # Créer un zip
            zip_path = os.path.join(tmpdir, 'model.zip')
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for root, dirs, files in os.walk(model_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, model_path)
                        zipf.write(file_path, arcname)
            
            # Lire le zip en bytes
            with open(zip_path, 'rb') as f:
                model_data = f.read()
        
        # Métadonnées
        metadata = {
            'modelType': 'generation',
            'inputSize': int(self.model.input_shape[1]),
            'outputSize': int(self.model.output_shape[1]),
            'hiddenLayers': [layer.units for layer in self.model.layers if isinstance(layer, layers.Dense)][:-1],
            'trainingDataSize': len(self.recipes),
        }
        
        # Sauvegarder dans le JSON
        model_id = save_model_to_db(
            'recipe_generation',
            'generation',
            model_version,
            model_data,
            metadata,
            len(self.recipes),
            False
        )
        
        return model_id
    
    def predict(self, user_features: List[float], top_k: int = 5) -> List[Dict[str, float]]:
        """Prédit les recettes recommandées pour génération"""
        if self.model is None:
            raise ValueError("Modèle non chargé")
        
        # Prédire
        X = np.array([user_features])
        predictions = self.model.predict(X, verbose=0)[0]
        
        # Trier et prendre top K
        top_indices = np.argsort(predictions)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            results.append({
                'recipeId': int(idx),
                'score': float(predictions[idx])
            })
        
        return results
    
    @classmethod
    def load_from_db(cls, model_version: str = 'latest') -> 'GenerationModel':
        """Charge un modèle depuis le fichier JSON"""
        result = load_model_from_db('recipe_generation', model_version)
        if result is None:
            raise ValueError("Modèle non trouvé")
        
        # Désérialiser le modèle
        import tempfile
        import os
        import zipfile
        import base64
        
        model_data_str = result['model_data']
        
        # Décoder depuis base64 si nécessaire
        if isinstance(model_data_str, str):
            try:
                model_data = base64.b64decode(model_data_str)
            except:
                # Si ce n'est pas du base64, essayer directement
                model_data = model_data_str.encode('latin-1') if isinstance(model_data_str, str) else model_data_str
        else:
            model_data = model_data_str
        
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = os.path.join(tmpdir, 'model.zip')
            with open(zip_path, 'wb') as f:
                f.write(model_data)
            
            model_path = os.path.join(tmpdir, 'model')
            with zipfile.ZipFile(zip_path, 'r') as zipf:
                zipf.extractall(model_path)
            
            # Charger le modèle
            instance = cls()
            instance.model = keras.models.load_model(model_path)
            
            # Charger les recettes
            instance.recipes = load_recipe_dataset()
            instance.feature_extractor.build_vocabularies(instance.recipes)
            instance.feature_extractor.calculate_dataset_stats(instance.recipes)
        
        return instance

