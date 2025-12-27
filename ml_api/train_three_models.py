#!/usr/bin/env python3
"""
Script pour entraîner les trois modèles de classification et afficher leur accuracy
"""

import sys
import os
import json

# DÉSACTIVER TOUS LES LOGS TENSORFLOW AVANT L'IMPORT pour éviter le blocage de l'IDE
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # 0=all, 1=info, 2=warnings, 3=errors
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Désactiver oneDNN
os.environ['KERAS_BACKEND'] = 'tensorflow'

# Limiter les threads TensorFlow pour éviter le blocage
os.environ['TF_NUM_INTEROP_THREADS'] = '2'
os.environ['TF_NUM_INTRAOP_THREADS'] = '2'

# Désactiver les warnings Python
import warnings
warnings.filterwarnings('ignore')

from classification_model import ClassificationModel
from database import save_model_to_db, activate_model

def print_separator(title=""):
    """Affiche un séparateur visuel"""
    if title:
        print("\n" + "=" * 80)
        print(f"  {title}")
        print("=" * 80)
    else:
        print("-" * 80)

def print_metrics_table(model_name, metrics):
    """Affiche les métriques dans un tableau formaté"""
    print(f"\n📊 Métriques pour {model_name}:")
    print("┌─────────────────────────────────────────────────────────────┐")
    print("│ Métrique          │ Valeur                                  │")
    print("├─────────────────────────────────────────────────────────────┤")
    print(f"│ Accuracy          │ {metrics['accuracy']*100:>6.2f}%                                │")
    print(f"│ Precision         │ {metrics['precision']*100:>6.2f}%                                │")
    print(f"│ Recall            │ {metrics['recall']*100:>6.2f}%                                │")
    print(f"│ F1-Score          │ {metrics['f1Score']:>6.4f}                                │")
    print(f"│ Loss              │ {metrics['loss']:>6.4f}                                │")
    print("└─────────────────────────────────────────────────────────────┘")

def train_model(config, model_num):
    """Entraîne un modèle avec une configuration donnée"""
    print_separator(f"Modèle {model_num}: {config['name'].replace('Modèle ', '')}")
    
    try:
        # Créer une nouvelle instance pour chaque modèle pour éviter les conflits de noms
        model = ClassificationModel()
        
        # Entraîner le modèle
        print(f"\n🔧 Configuration:", flush=True)
        print(f"   - Hidden Layers: {config['hidden_layers']}", flush=True)
        print(f"   - Learning Rate: {config['learning_rate']}", flush=True)
        print(f"   - Dropout: {config['dropout']}", flush=True)
        print(f"   - Epochs: {config['epochs']}", flush=True)
        print(f"   - Batch Size: {config['batch_size']}", flush=True)
        print(f"\n🎯 Démarrage de l'entraînement...", flush=True)
        sys.stdout.flush()
        
        # Utiliser un nom unique pour éviter les conflits de noms de couches
        model_name = f"model_{model_num}"
        metrics = model.train(
            epochs=config['epochs'],
            batch_size=config['batch_size'],
            hidden_layers=config['hidden_layers'],
            learning_rate=config['learning_rate'],
            dropout=config['dropout'],
            model_name=model_name
        )
        
        # Sauvegarder le modèle
        model_version = f"classification_model{model_num}_v{int(__import__('time').time())}"
        print(f"\n💾 Sauvegarde du modèle...")
        model_id = model.save(model_version)
        
        # Activer le modèle (le dernier entraîné sera actif)
        activate_model(model_id, 'recipe_classification')
        
        print_metrics_table(config['name'], metrics)
        
        return {
            'model_num': model_num,
            'name': config['name'],
            'model_id': model_id,
            'metrics': metrics,
            'config': config
        }
        
    except Exception as e:
        print(f"❌ Erreur lors de l'entraînement du modèle {model_num}: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Fonction principale"""
    print("\n" + "⚠️" * 40)
    print("⚠️  ATTENTION: Ce script est DÉSACTIVÉ pour éviter les blocages!")
    print("⚠️  Utilisez plutôt: python3 train_simple.py")
    print("⚠️  Ce script entraîne un seul modèle et affiche l'accuracy.")
    print("⚠️" * 40 + "\n")
    sys.exit(1)
    
    print_separator("ENTRAÎNEMENT DES TROIS MODÈLES DE CLASSIFICATION")
    
    # Définir les trois configurations de modèles
    model_configs = [
        {
            'name': 'Modèle 1: Deep and Wide Network',
            'hidden_layers': [512, 512, 256, 128, 64],
            'learning_rate': 0.0005,
            'dropout': 0.4,
            'epochs': 200,
            'batch_size': 128
        },
        {
            'name': 'Modèle 2: Very Deep Network',
            'hidden_layers': [1024, 512, 256, 128, 64],
            'learning_rate': 0.0003,
            'dropout': 0.45,
            'epochs': 200,
            'batch_size': 128
        },
        {
            'name': 'Modèle 3: Balanced Deep Network',
            'hidden_layers': [768, 384, 192, 96, 48],
            'learning_rate': 0.0004,
            'dropout': 0.4,
            'epochs': 200,
            'batch_size': 128
        }
    ]
    
    results = []
    
    # Entraîner chaque modèle
    for i, config in enumerate(model_configs, 1):
        result = train_model(config, i)
        if result:
            results.append(result)
    
    # Afficher le résumé final
    print_separator("RÉSUMÉ DES RÉSULTATS")
    
    if not results:
        print("❌ Aucun modèle n'a pu être entraîné avec succès.")
        sys.exit(1)
    
    # Trier par accuracy décroissante
    results.sort(key=lambda x: x['metrics']['accuracy'], reverse=True)
    
    print("\n🏆 Classement des modèles par Accuracy:")
    print("┌─────┬──────────────────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐")
    print("│ #   │ Modèle                               │ Accuracy │ Precision│ Recall   │ F1-Score │ Loss     │")
    print("├─────┼──────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤")
    
    for i, result in enumerate(results, 1):
        m = result['metrics']
        name = result['name'].replace('Modèle ', 'M').split(':')[0]  # Raccourcir le nom
        print(f"│ {i}   │ {name:<36} │ {m['accuracy']*100:>7.2f}% │ {m['precision']*100:>7.2f}% │ {m['recall']*100:>7.2f}% │ {m['f1Score']:>8.4f} │ {m['loss']:>8.4f} │")
    
    print("└─────┴──────────────────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘")
    
    # Afficher le meilleur modèle
    best = results[0]
    print(f"\n🥇 Meilleur modèle: {best['name']}")
    print(f"   Model ID: {best['model_id']}")
    print(f"   Accuracy: {best['metrics']['accuracy']*100:.2f}%")
    print(f"   Ce modèle a été activé automatiquement.")
    
    print_separator("FIN DE L'ENTRAÎNEMENT")

if __name__ == '__main__':
    main()




