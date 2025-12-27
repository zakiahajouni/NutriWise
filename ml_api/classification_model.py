"""
Modèle de classification pour recommandations de recettes
Utilise TensorFlow/Keras pour créer un réseau de neurones profond
"""

import os
import sys

# DÉSACTIVER TOUS LES LOGS TENSORFLOW pour éviter le blocage de l'IDE
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # 0=all, 1=info, 2=warnings, 3=errors
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['KERAS_BACKEND'] = 'tensorflow'

# Limiter les threads TensorFlow
os.environ['TF_NUM_INTEROP_THREADS'] = '2'
os.environ['TF_NUM_INTRAOP_THREADS'] = '2'

# Désactiver les warnings
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import tensorflow as tf

# Configurer TensorFlow pour éviter le blocage
tf.config.threading.set_inter_op_parallelism_threads(2)
tf.config.threading.set_intra_op_parallelism_threads(2)

# Désactiver les logs TensorFlow
tf.get_logger().setLevel('ERROR')

from tensorflow import keras
from tensorflow.keras import layers, models, callbacks
from typing import Dict, List, Tuple, Optional, Any
import json
import pickle
from database import save_model_to_db, activate_model, load_model_from_db
from feature_extractor import FeatureExtractor
from dataset_loader import load_recipe_dataset

class ClassificationModel:
    """Modèle de classification pour recommandations de recettes"""
    
    def __init__(self):
        self.model: Optional[keras.Model] = None
        self.feature_extractor = FeatureExtractor()
        self.recipes: List[Dict[str, Any]] = []
    
    def create_model(
        self,
        input_size: int,
        output_size: int,
        hidden_layers: List[int] = [512, 512, 256, 128, 64],
        learning_rate: float = 0.0004,
        dropout: float = 0.4,
        name_prefix: str = ''
    ) -> keras.Model:
        """Crée un modèle de classification"""
        # Réinitialiser self.model pour éviter les conflits de noms
        self.model = None
        
        # Créer un préfixe unique pour les noms de couches
        # Toujours utiliser un préfixe unique pour éviter les conflits
        if not name_prefix:
            import time
            import random
            name_prefix = f"m{int(time.time()*1000)}_{random.randint(1000, 9999)}"
        prefix = f"{name_prefix}_"
        
        model = keras.Sequential()
        
        # Input layer avec batch normalization
        model.add(layers.Dense(
            hidden_layers[0],
            input_shape=(input_size,),
            activation='relu',
            kernel_initializer='he_normal',
            kernel_regularizer=keras.regularizers.l2(0.0001),
            name=f'{prefix}input_layer'
        ))
        model.add(layers.BatchNormalization(name=f'{prefix}bn_input'))
        
        # Hidden layers
        for i, units in enumerate(hidden_layers[1:], 1):
            model.add(layers.Dense(
                units,
                activation='relu',
                kernel_initializer='he_normal',
                kernel_regularizer=keras.regularizers.l2(0.0001),
                name=f'{prefix}hidden_layer_{i}'
            ))
            model.add(layers.BatchNormalization(name=f'{prefix}bn_{i}'))
            model.add(layers.Dropout(dropout, name=f'{prefix}dropout_{i}'))
        
        # Output layer
        model.add(layers.Dense(
            output_size,
            activation='softmax',
            kernel_initializer='glorot_uniform',
            name=f'{prefix}output_layer'
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
        recipes: List[Dict[str, Any]],
        use_real_interactions: bool = False
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Prépare les données d'entraînement"""
        # Construire les vocabulaires
        self.feature_extractor.build_vocabularies(recipes)
        stats = self.feature_extractor.calculate_dataset_stats(recipes)
        
        # Générer les données d'entraînement
        features = []
        labels = []
        
        if use_real_interactions:
            # TODO: Charger les vraies interactions depuis la DB
            pass
        
        # Générer des données synthétiques
        user_profiles = [
            {'age': 25, 'gender': 'female', 'activity': 'active', 'diet': 'healthy', 'healthy': True},
            {'age': 35, 'gender': 'male', 'activity': 'moderate', 'diet': 'normal', 'healthy': False},
            {'age': 45, 'gender': 'female', 'activity': 'light', 'diet': 'vegetarian', 'healthy': True},
        ]
        
        cuisines = ['Italian', 'Tunisian', 'French', 'Asian', 'Mediterranean', 'Mexican', 'Indian', 'American', 'Other']
        # Réduire le nombre d'exemples pour éviter les blocages (peut être augmenté plus tard)
        examples_per_recipe = max(20, 5000 // len(recipes))  # Réduit de 12000 à 5000
        
        for recipe in recipes:
            for i in range(examples_per_recipe):
                profile = user_profiles[i % len(user_profiles)]
                
                # Déterminer les correspondances
                cuisine_match = np.random.random() < 0.7
                cuisine = recipe['cuisine_type'] if cuisine_match else np.random.choice(cuisines)
                
                recipe_type = recipe.get('recipe_type', 'savory')
                is_healthy = recipe.get('is_healthy', False)
                
                # Ingrédients disponibles (30-80% de la recette)
                ingredients = recipe.get('ingredients', [])
                if isinstance(ingredients, str):
                    ingredients = json.loads(ingredients)
                
                ingredient_ratio = 0.3 + np.random.random() * 0.5
                num_ingredients = max(1, int(len(ingredients) * ingredient_ratio))
                available_ingredients = np.random.choice(ingredients, min(num_ingredients, len(ingredients)), replace=False).tolist()
                
                # Extraire les features
                user_features = self.feature_extractor.extract_user_request_features(
                    available_ingredients,
                    recipe_type,
                    cuisine,
                    is_healthy,
                    [],
                    stats
                )
                
                features.append(user_features)
                labels.append(recipes.index(recipe))
        
        # Convertir en numpy arrays
        X = np.array(features)
        y = np.array(labels)
        
        # One-hot encoding des labels
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
        epochs: int = 200,
        batch_size: int = 128,
        validation_split: float = 0.15,
        hidden_layers: List[int] = [512, 512, 256, 128, 64],
        learning_rate: float = 0.0004,
        dropout: float = 0.4,
        model_name: str = ''
    ) -> Dict[str, Any]:
        """Entraîne le modèle"""
        # Charger les recettes
        recipes = load_recipe_dataset()
        self.recipes = recipes
        
        if len(recipes) < 50:
            raise ValueError(f"Dataset trop petit ({len(recipes)} recettes). Minimum 50 requis.")
        
        # Préparer les données
        X_train, y_train, X_val, y_val, X_test, y_test = self.prepare_training_data(recipes)
        
        # Créer le modèle avec un préfixe unique
        input_size = X_train.shape[1]
        output_size = len(recipes)
        model = self.create_model(input_size, output_size, hidden_layers, learning_rate, dropout, name_prefix=model_name)
        
        # Callback personnalisé pour afficher l'accuracy (avec flush pour éviter les buffers)
        class AccuracyCallback(callbacks.Callback):
            def __init__(self, print_interval=5, total_epochs=20):
                super().__init__()
                self.print_interval = print_interval
                self.total_epochs = total_epochs
                self.best_val_acc = 0.0
                self.best_train_acc = 0.0
                
            def on_epoch_end(self, epoch, logs=None):
                logs = logs or {}
                train_acc = logs.get('accuracy', 0)
                val_acc = logs.get('val_accuracy', 0)
                train_loss = logs.get('loss', 0)
                val_loss = logs.get('val_loss', 0)
                
                # Mettre à jour les meilleures valeurs
                if val_acc > self.best_val_acc:
                    self.best_val_acc = val_acc
                if train_acc > self.best_train_acc:
                    self.best_train_acc = train_acc
                
                # Afficher tous les N epochs ou à chaque epoch si moins de 20
                if self.total_epochs <= 20 or (epoch + 1) % self.print_interval == 0 or epoch == self.total_epochs - 1:
                    msg = f"   Epoch {epoch+1}/{self.total_epochs} - Train Acc: {train_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}% | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}"
                    print(msg, flush=True)
                    sys.stdout.flush()  # Force le flush pour éviter les buffers
            
            def on_train_end(self, logs=None):
                print(f"\n   ✅ Meilleure accuracy d'entraînement: {self.best_train_acc*100:.2f}%", flush=True)
                print(f"   ✅ Meilleure accuracy de validation: {self.best_val_acc*100:.2f}%", flush=True)
                sys.stdout.flush()
        
        # Callbacks - patience plus élevée pour permettre au modèle d'apprendre
        # Avec 8000 classes, le modèle a besoin de plus de temps
        patience = max(15, epochs // 4)  # Patience adaptative mais minimum 15
        early_stopping = callbacks.EarlyStopping(
            monitor='val_loss',
            patience=patience,
            restore_best_weights=True,
            verbose=0  # Pas de message pour éviter le spam
        )
        
        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=0  # Pas de message pour éviter le spam
        )
        
        # Ajuster l'intervalle d'affichage selon le nombre d'epochs
        if epochs <= 20:
            print_interval = 1  # Afficher chaque epoch
        elif epochs <= 50:
            print_interval = 5  # Afficher toutes les 5 epochs
        else:
            print_interval = 10  # Afficher toutes les 10 epochs
        
        accuracy_callback = AccuracyCallback(print_interval=print_interval, total_epochs=epochs)
        
        # Entraîner avec verbose=0 pour éviter le blocage
        if epochs <= 20:
            print(f"   ⏳ Entraînement en cours ({epochs} epochs, affichage à chaque epoch)...", flush=True)
        else:
            print(f"   ⏳ Entraînement en cours ({epochs} epochs max, affichage toutes les {print_interval} epochs)...", flush=True)
        print("   " + "="*70, flush=True)
        sys.stdout.flush()
        
        # Désactiver COMPLÈTEMENT tous les logs et redirections
        import logging
        import contextlib
        
        # Fermer tous les handlers de logging
        for handler in logging.root.handlers[:]:
            logging.root.removeHandler(handler)
        
        logging.getLogger('tensorflow').setLevel(logging.CRITICAL)
        logging.getLogger('keras').setLevel(logging.CRITICAL)
        logging.getLogger().setLevel(logging.CRITICAL)
        
        # Rediriger stderr vers /dev/null temporairement
        original_stderr = sys.stderr
        try:
            # Ouvrir /dev/null pour rediriger stderr
            devnull = open(os.devnull, 'w')
            sys.stderr = devnull
            
            # Entraîner le modèle (silencieusement)
            history = model.fit(
                X_train, y_train,
                validation_data=(X_val, y_val),
                epochs=epochs,
                batch_size=batch_size,
                callbacks=[early_stopping, reduce_lr, accuracy_callback],
                verbose=0
            )
            
            # Restaurer stderr
            sys.stderr = original_stderr
            devnull.close()
            
        except Exception as e:
            # Restaurer stderr en cas d'erreur
            sys.stderr = original_stderr
            if 'devnull' in locals():
                devnull.close()
            raise
        
        print("   " + "="*70, flush=True)
        sys.stdout.flush()
        
        # Évaluer
        print("\n📊 Évaluation sur le jeu de test...", flush=True)
        sys.stdout.flush()
        test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
        print(f"   ✅ Test Accuracy: {test_accuracy*100:.2f}%", flush=True)
        print(f"   ✅ Test Loss: {test_loss:.4f}", flush=True)
        sys.stdout.flush()
        
        # Calculer precision, recall, F1
        print("📈 Calcul des métriques détaillées...", flush=True)
        sys.stdout.flush()
        y_pred = model.predict(X_test, verbose=0)
        y_pred_classes = np.argmax(y_pred, axis=1)
        y_true_classes = np.argmax(y_test, axis=1)
        
        from sklearn.metrics import precision_score, recall_score, f1_score
        precision = precision_score(y_true_classes, y_pred_classes, average='macro', zero_division=0)
        recall = recall_score(y_true_classes, y_pred_classes, average='macro', zero_division=0)
        f1 = f1_score(y_true_classes, y_pred_classes, average='macro', zero_division=0)
        
        print(f"   ✅ Precision: {precision*100:.2f}%", flush=True)
        print(f"   ✅ Recall: {recall*100:.2f}%", flush=True)
        print(f"   ✅ F1-Score: {f1:.4f}", flush=True)
        sys.stdout.flush()
        
        metrics = {
            'accuracy': float(test_accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1Score': float(f1),
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
            model_version = f"classification_v{int(time.time())}"
        
        # Sérialiser le modèle
        import tempfile
        import os
        with tempfile.TemporaryDirectory() as tmpdir:
            # Utiliser export() pour le format SavedModel (compatible avec les nouvelles versions de Keras)
            model_path = os.path.join(tmpdir, 'saved_model')
            try:
                # Nouvelle API Keras 3.x: utiliser export() pour SavedModel
                self.model.export(model_path)
            except (AttributeError, TypeError):
                # Fallback pour anciennes versions: utiliser save() avec extension .keras
                model_path_keras = os.path.join(tmpdir, 'model.keras')
                self.model.save(model_path_keras)
                # Créer une structure SavedModel pour compatibilité
                import shutil
                saved_model_dir = os.path.join(tmpdir, 'saved_model')
                os.makedirs(saved_model_dir, exist_ok=True)
                shutil.copy(model_path_keras, os.path.join(saved_model_dir, 'model.keras'))
                model_path = saved_model_dir
            
            # Lire les fichiers du modèle
            import zipfile
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
            'modelType': 'classification',
            'inputSize': int(self.model.input_shape[1]),
            'outputSize': int(self.model.output_shape[1]),
            'hiddenLayers': [layer.units for layer in self.model.layers if isinstance(layer, layers.Dense)][:-1],
            'trainingDataSize': len(self.recipes),
            'accuracy': 0.0,  # Sera mis à jour après l'entraînement
        }
        
        # Sauvegarder dans le JSON
        model_id = save_model_to_db(
            'recipe_classification',
            'classification',
            model_version,
            model_data,
            metadata,
            len(self.recipes),
            False
        )
        
        return model_id
    
    def predict(self, user_features: List[float], top_k: int = 10) -> List[Dict[str, float]]:
        """Prédit les recettes recommandées"""
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
    def load_from_db(cls, model_version: str = 'latest') -> 'ClassificationModel':
        """Charge un modèle depuis le fichier JSON"""
        result = load_model_from_db('recipe_classification', model_version)
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
            
            # Charger les recettes pour avoir les métadonnées
            instance.recipes = load_recipe_dataset()
            instance.feature_extractor.build_vocabularies(instance.recipes)
            instance.feature_extractor.calculate_dataset_stats(instance.recipes)
        
        return instance

