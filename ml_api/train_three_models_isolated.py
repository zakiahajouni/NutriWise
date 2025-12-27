#!/usr/bin/env python3
"""
Script isolé pour entraîner les trois modèles de classification
Utilise un processus séparé pour éviter le blocage de l'IDE
"""

import sys
import os
import multiprocessing
import json

# DÉSACTIVER TOUS LES LOGS AVANT TOUT
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['KERAS_BACKEND'] = 'tensorflow'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'

# Rediriger stdout vers un fichier pour éviter le blocage
import io
import contextlib

def train_model_isolated(config_dict, model_num, output_file):
    """Fonction isolée pour entraîner un modèle dans un processus séparé"""
    # Réimporter dans le processus enfant
    import warnings
    warnings.filterwarnings('ignore')
    
    # Configurer TensorFlow dans le processus enfant
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
    
    import tensorflow as tf
    tf.config.threading.set_inter_op_parallelism_threads(1)
    tf.config.threading.set_intra_op_parallelism_threads(1)
    tf.get_logger().setLevel('ERROR')
    
    from classification_model import ClassificationModel
    from database import save_model_to_db, activate_model
    
    try:
        # Rediriger la sortie vers le fichier
        with open(output_file, 'a') as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"Modèle {model_num}: {config_dict['name']}\n")
            f.write(f"{'='*80}\n")
            f.write(f"Configuration:\n")
            f.write(f"  - Hidden Layers: {config_dict['hidden_layers']}\n")
            f.write(f"  - Learning Rate: {config_dict['learning_rate']}\n")
            f.write(f"  - Dropout: {config_dict['dropout']}\n")
            f.write(f"  - Epochs: {config_dict['epochs']}\n")
            f.write(f"  - Batch Size: {config_dict['batch_size']}\n")
            f.write(f"\n🎯 Entraînement en cours...\n")
            f.flush()
        
        model = ClassificationModel()
        model_name = f"model_{model_num}"
        
        metrics = model.train(
            epochs=config_dict['epochs'],
            batch_size=config_dict['batch_size'],
            hidden_layers=config_dict['hidden_layers'],
            learning_rate=config_dict['learning_rate'],
            dropout=config_dict['dropout'],
            model_name=model_name
        )
        
        model_version = f"classification_model{model_num}_v{int(__import__('time').time())}"
        model_id = model.save(model_version)
        activate_model(model_id, 'recipe_classification')
        
        # Écrire les résultats dans le fichier
        with open(output_file, 'a') as f:
            f.write(f"\n✅ Entraînement terminé!\n")
            f.write(f"📊 Métriques:\n")
            f.write(f"  - Accuracy: {metrics['accuracy']*100:.2f}%\n")
            f.write(f"  - Precision: {metrics['precision']*100:.2f}%\n")
            f.write(f"  - Recall: {metrics['recall']*100:.2f}%\n")
            f.write(f"  - F1-Score: {metrics['f1Score']:.4f}\n")
            f.write(f"  - Loss: {metrics['loss']:.4f}\n")
            f.write(f"  - Model ID: {model_id}\n")
            f.flush()
        
        return {
            'success': True,
            'model_num': model_num,
            'name': config_dict['name'],
            'model_id': model_id,
            'metrics': metrics
        }
    except Exception as e:
        with open(output_file, 'a') as f:
            f.write(f"\n❌ Erreur: {str(e)}\n")
            f.flush()
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'model_num': model_num,
            'error': str(e)
        }

def main():
    """Fonction principale"""
    print("="*80)
    print("ENTRAÎNEMENT DES TROIS MODÈLES DE CLASSIFICATION")
    print("="*80)
    print("\n⚠️  Ce script utilise des processus séparés pour éviter le blocage de l'IDE")
    print("📝 Les résultats seront affichés en temps réel dans le terminal\n")
    
    # Configurations des modèles
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
    
    # Créer un fichier de sortie pour les logs
    log_file = 'training_logs.txt'
    with open(log_file, 'w') as f:
        f.write("Logs d'entraînement des modèles\n")
        f.write("="*80 + "\n")
    
    print(f"📝 Les logs détaillés sont sauvegardés dans: {log_file}\n")
    
    results = []
    
    # Entraîner chaque modèle dans un processus séparé
    for i, config in enumerate(model_configs, 1):
        print(f"🚀 Démarrage de l'entraînement du Modèle {i}...")
        sys.stdout.flush()
        
        # Utiliser multiprocessing pour isoler complètement
        process = multiprocessing.Process(
            target=train_model_isolated,
            args=(config, i, log_file)
        )
        process.start()
        process.join()  # Attendre la fin
        
        # Lire les résultats depuis le fichier de log
        print(f"✅ Modèle {i} terminé. Vérifiez {log_file} pour les détails.\n")
        sys.stdout.flush()
    
    # Lire et afficher le résumé depuis le fichier de log
    print("\n" + "="*80)
    print("RÉSUMÉ DES RÉSULTATS")
    print("="*80)
    
    try:
        with open(log_file, 'r') as f:
            print(f.read())
    except:
        print("Impossible de lire le fichier de log")
    
    print("\n✅ Entraînement terminé! Vérifiez le fichier training_logs.txt pour les détails complets.")

if __name__ == '__main__':
    # Utiliser 'spawn' pour Windows/Linux pour isoler complètement
    multiprocessing.set_start_method('spawn', force=True)
    main()



