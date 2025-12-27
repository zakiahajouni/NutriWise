#!/usr/bin/env python3
"""
Worker isolé pour entraîner un modèle - processus complètement séparé
"""

import os
import sys
import json
import time

# DÉSACTIVER TOUS LES LOGS AVANT TOUT
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['KERAS_BACKEND'] = 'tensorflow'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'

# Rediriger stderr vers /dev/null
sys.stderr = open(os.devnull, 'w')

import warnings
warnings.filterwarnings('ignore')

def train_single_model(config_json, model_num, output_file):
    """Entraîne un seul modèle dans un processus complètement isolé"""
    try:
        config = json.loads(config_json)
        
        # Réimporter dans le processus enfant
        import tensorflow as tf
        tf.config.threading.set_inter_op_parallelism_threads(1)
        tf.config.threading.set_intra_op_parallelism_threads(1)
        tf.get_logger().setLevel('ERROR')
        
        from classification_model import ClassificationModel
        from database import save_model_to_db, activate_model
        
        # Ouvrir le fichier de sortie
        with open(output_file, 'a') as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"Modèle {model_num}: {config['name']}\n")
            f.write(f"{'='*80}\n")
            f.write(f"Configuration: {config}\n\n")
            f.write(f"🎯 Démarrage de l'entraînement...\n")
            f.flush()
        
        model = ClassificationModel()
        model_name = f"model_{model_num}"
        
        # Entraîner (sans aucun affichage)
        metrics = model.train(
            epochs=config['epochs'],
            batch_size=config['batch_size'],
            hidden_layers=config['hidden_layers'],
            learning_rate=config['learning_rate'],
            dropout=config['dropout'],
            model_name=model_name
        )
        
        model_version = f"classification_model{model_num}_v{int(time.time())}"
        model_id = model.save(model_version)
        activate_model(model_id, 'recipe_classification')
        
        # Écrire les résultats
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
        
        return json.dumps({
            'success': True,
            'model_num': model_num,
            'name': config['name'],
            'model_id': model_id,
            'metrics': metrics
        })
    except Exception as e:
        import traceback
        error_msg = str(e) + "\n" + traceback.format_exc()
        with open(output_file, 'a') as f:
            f.write(f"\n❌ Erreur: {error_msg}\n")
            f.flush()
        return json.dumps({
            'success': False,
            'model_num': model_num,
            'error': str(e)
        })

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: train_models_worker.py <config_json> <model_num> <output_file>")
        sys.exit(1)
    
    config_json = sys.argv[1]
    model_num = int(sys.argv[2])
    output_file = sys.argv[3]
    
    result = train_single_model(config_json, model_num, output_file)
    print(result)  # Pour que le processus parent puisse le lire

