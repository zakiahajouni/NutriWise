#!/usr/bin/env python3
"""
Entraîner UN SEUL modèle à la fois - évite tout blocage
"""

import sys
import os
import json

# DÉSACTIVER TOUS LES LOGS AVANT L'IMPORT
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['KERAS_BACKEND'] = 'tensorflow'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'

import warnings
warnings.filterwarnings('ignore')

from classification_model import ClassificationModel
from database import save_model_to_db, activate_model

# Configurations des 3 modèles
MODEL_CONFIGS = {
    '1': {
        'name': 'Modèle 1: Deep and Wide Network',
        'hidden_layers': [512, 512, 256, 128, 64],
        'learning_rate': 0.0005,
        'dropout': 0.4,
        'epochs': 200,
        'batch_size': 128
    },
    '2': {
        'name': 'Modèle 2: Very Deep Network',
        'hidden_layers': [1024, 512, 256, 128, 64],
        'learning_rate': 0.0003,
        'dropout': 0.45,
        'epochs': 200,
        'batch_size': 128
    },
    '3': {
        'name': 'Modèle 3: Balanced Deep Network',
        'hidden_layers': [768, 384, 192, 96, 48],
        'learning_rate': 0.0004,
        'dropout': 0.4,
        'epochs': 200,
        'batch_size': 128
    }
}

def print_menu():
    """Affiche le menu de sélection"""
    print("\n" + "="*80)
    print("ENTRAÎNEMENT DES MODÈLES DE CLASSIFICATION")
    print("="*80)
    print("\nChoisissez le modèle à entraîner :")
    print()
    for key, config in MODEL_CONFIGS.items():
        print(f"  {key}. {config['name']}")
        print(f"     Architecture: {config['hidden_layers']}")
        print(f"     Learning Rate: {config['learning_rate']}")
        print(f"     Dropout: {config['dropout']}")
        print()
    print("  4. Entraîner les 3 modèles un par un")
    print("  0. Quitter")
    print()

def train_model(model_num, config):
    """Entraîne un seul modèle"""
    print("\n" + "="*80)
    print(f"ENTRAÎNEMENT DU {config['name']}")
    print("="*80)
    
    print(f"\n🔧 Configuration:")
    print(f"   - Hidden Layers: {config['hidden_layers']}")
    print(f"   - Learning Rate: {config['learning_rate']}")
    print(f"   - Dropout: {config['dropout']}")
    print(f"   - Epochs: {config['epochs']}")
    print(f"   - Batch Size: {config['batch_size']}")
    print(f"\n🎯 Démarrage de l'entraînement...")
    sys.stdout.flush()
    
    try:
        model = ClassificationModel()
        model_name = f"model_{model_num}"
        
        # Entraîner
        metrics = model.train(
            epochs=config['epochs'],
            batch_size=config['batch_size'],
            hidden_layers=config['hidden_layers'],
            learning_rate=config['learning_rate'],
            dropout=config['dropout'],
            model_name=model_name
        )
        
        # Sauvegarder
        import time
        model_version = f"classification_model{model_num}_v{int(time.time())}"
        print(f"\n💾 Sauvegarde du modèle...")
        sys.stdout.flush()
        model_id = model.save(model_version)
        activate_model(model_id, 'recipe_classification')
        
        # Afficher les résultats
        print("\n" + "="*80)
        print("✅ ENTRAÎNEMENT TERMINÉ!")
        print("="*80)
        print(f"\n📊 Métriques du {config['name']}:")
        print("┌─────────────────────────────────────────────────────────────┐")
        print("│ Métrique          │ Valeur                                  │")
        print("├─────────────────────────────────────────────────────────────┤")
        print(f"│ Accuracy          │ {metrics['accuracy']*100:>6.2f}%                                │")
        print(f"│ Precision         │ {metrics['precision']*100:>6.2f}%                                │")
        print(f"│ Recall            │ {metrics['recall']*100:>6.2f}%                                │")
        print(f"│ F1-Score          │ {metrics['f1Score']:>6.4f}                                │")
        print(f"│ Loss              │ {metrics['loss']:>6.4f}                                │")
        print("└─────────────────────────────────────────────────────────────┘")
        print(f"\n💾 Model ID: {model_id}")
        print(f"✅ Modèle activé dans la base de données")
        print("="*80)
        
        return {
            'success': True,
            'model_num': model_num,
            'name': config['name'],
            'model_id': model_id,
            'metrics': metrics
        }
        
    except Exception as e:
        print(f"\n❌ Erreur lors de l'entraînement: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Fonction principale"""
    if len(sys.argv) > 1:
        # Mode non-interactif : entraîner le modèle spécifié
        choice = sys.argv[1]
    else:
        # Mode interactif : afficher le menu
        print_menu()
        choice = input("Votre choix (0-4): ").strip()
    
    if choice == '0':
        print("Au revoir!")
        return
    
    if choice in MODEL_CONFIGS:
        # Entraîner un seul modèle
        config = MODEL_CONFIGS[choice]
        result = train_model(choice, config)
        if result:
            print(f"\n✅ Modèle {choice} entraîné avec succès!")
            print(f"   Accuracy: {result['metrics']['accuracy']*100:.2f}%")
    elif choice == '4':
        # Entraîner les 3 modèles un par un
        print("\n🔄 Entraînement des 3 modèles un par un...")
        results = []
        
        for model_num, config in MODEL_CONFIGS.items():
            print(f"\n{'='*80}")
            print(f"MODÈLE {model_num}/3")
            print(f"{'='*80}")
            
            result = train_model(model_num, config)
            if result:
                results.append(result)
            
            if model_num != '3':
                print(f"\n⏸️  Pause avant le modèle suivant...")
                input("Appuyez sur Entrée pour continuer...")
        
        # Afficher le résumé
        if results:
            print("\n" + "="*80)
            print("RÉSUMÉ DES 3 MODÈLES")
            print("="*80)
            
            results.sort(key=lambda x: x['metrics']['accuracy'], reverse=True)
            
            print("\n🏆 Classement par Accuracy:")
            print("┌─────┬──────────────────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐")
            print("│ #   │ Modèle                               │ Accuracy │ Precision│ Recall   │ F1-Score │ Loss     │")
            print("├─────┼──────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤")
            
            for i, result in enumerate(results, 1):
                m = result['metrics']
                name = result['name'].replace('Modèle ', 'M').split(':')[0]
                print(f"│ {i}   │ {name:<36} │ {m['accuracy']*100:>7.2f}% │ {m['precision']*100:>7.2f}% │ {m['recall']*100:>7.2f}% │ {m['f1Score']:>8.4f} │ {m['loss']:>8.4f} │")
            
            print("└─────┴──────────────────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘")
            
            best = results[0]
            print(f"\n🥇 Meilleur modèle: {best['name']}")
            print(f"   Accuracy: {best['metrics']['accuracy']*100:.2f}%")
    else:
        print("❌ Choix invalide!")

if __name__ == '__main__':
    main()





