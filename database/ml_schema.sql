-- Schéma de base de données pour le système ML
-- Table pour stocker le dataset de recettes (peut être chargé depuis des sources externes)

USE nutriwise;

-- Table pour les templates de recettes (dataset ML)
CREATE TABLE IF NOT EXISTS recipe_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL, -- JSON array
  steps TEXT NOT NULL, -- JSON array
  prep_time INT, -- en minutes
  cook_time INT, -- en minutes
  servings INT,
  calories INT,
  estimated_price DECIMAL(10, 2),
  cuisine_type VARCHAR(100),
  recipe_type ENUM('sweet', 'savory') NOT NULL,
  is_healthy BOOLEAN DEFAULT FALSE,
  tags TEXT, -- JSON array pour tags additionnels
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recipe_type (recipe_type),
  INDEX idx_cuisine_type (cuisine_type),
  INDEX idx_is_healthy (is_healthy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour stocker les modèles ML entraînés
CREATE TABLE IF NOT EXISTS ml_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(100) NOT NULL, -- 'recommendation', 'classification', etc.
  model_version VARCHAR(50) NOT NULL,
  model_data LONGBLOB, -- Modèle sérialisé (TensorFlow.js ou JSON)
  model_metadata JSON, -- Métadonnées du modèle (accuracy, loss, etc.)
  training_data_size INT, -- Nombre d'exemples utilisés pour l'entraînement
  training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE,
  performance_metrics JSON, -- Métriques de performance (accuracy, precision, recall, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_model_version (model_name, model_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les interactions utilisateur (pour améliorer le modèle)
CREATE TABLE IF NOT EXISTS user_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_template_id INT,
  interaction_type ENUM('view', 'like', 'dislike', 'save', 'generate') NOT NULL,
  generated_recipe_id INT, -- Si généré par ML
  feedback_score INT, -- 1-5 si l'utilisateur a donné un feedback
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_template_id) REFERENCES recipe_templates(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_interaction_type (interaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les features d'ingrédients (pour le ML)
CREATE TABLE IF NOT EXISTS ingredient_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ingredient_name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100), -- 'vegetable', 'meat', 'dairy', etc.
  average_price DECIMAL(10, 2),
  nutritional_data JSON, -- Calories, protéines, etc.
  allergen_tags TEXT, -- JSON array
  cuisine_tags TEXT, -- JSON array des cuisines où cet ingrédient est commun
  embedding_vector TEXT, -- Vecteur d'embedding pour le ML (JSON array)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour l'historique d'entraînement
CREATE TABLE IF NOT EXISTS training_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_id INT NOT NULL,
  epoch INT NOT NULL,
  loss DECIMAL(10, 6),
  accuracy DECIMAL(10, 6),
  validation_loss DECIMAL(10, 6),
  validation_accuracy DECIMAL(10, 6),
  training_time_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES ml_models(id) ON DELETE CASCADE,
  INDEX idx_model_id (model_id),
  INDEX idx_epoch (epoch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer quelques recettes de base pour le dataset initial
INSERT INTO recipe_templates (name, description, ingredients, steps, prep_time, cook_time, servings, calories, estimated_price, cuisine_type, recipe_type, is_healthy, tags, difficulty) VALUES
('Pâtes Carbonara', 'Un classique italien crémeux et savoureux', 
 '["pâtes", "lardons", "œufs", "parmesan", "poivre"]',
 '["Faire cuire les pâtes dans l\'eau bouillante salée", "Faire revenir les lardons dans une poêle", "Mélanger les œufs avec le parmesan râpé", "Égoutter les pâtes et les mélanger avec les lardons", "Ajouter le mélange œufs-parmesan hors du feu en remuant rapidement", "Servir avec du poivre noir"]',
 10, 15, 4, 520, 8.50, 'Italian', 'savory', FALSE, '["comfort", "quick", "pasta"]', 'easy'),

('Salade César', 'Salade fraîche et croquante avec poulet grillé',
 '["laitue", "poulet", "parmesan", "croûtons", "sauce césar"]',
 '["Laver et couper la laitue", "Griller le poulet et le couper en dés", "Préparer la sauce césar", "Mélanger la laitue avec la sauce", "Ajouter le poulet, les croûtons et le parmesan", "Servir immédiatement"]',
 15, 10, 2, 380, 12.00, 'American', 'savory', TRUE, '["healthy", "salad", "protein"]', 'easy'),

('Couscous Tunisien', 'Plat traditionnel tunisien avec légumes et viande',
 '["semoule", "viande d\'agneau", "courgettes", "carottes", "pois chiches", "harissa"]',
 '["Préparer la semoule en la mouillant et la laissant gonfler", "Faire cuire la viande avec les épices", "Ajouter les légumes coupés en morceaux", "Faire cuire les pois chiches séparément", "Servir la semoule avec la viande et les légumes", "Accompagner avec de la harissa"]',
 20, 60, 6, 450, 15.00, 'Tunisian', 'savory', TRUE, '["traditional", "spicy", "hearty"]', 'medium'),

('Risotto aux Champignons', 'Risotto crémeux aux champignons',
 '["riz arborio", "champignons", "bouillon", "vin blanc", "parmesan", "oignon"]',
 '["Faire revenir l\'oignon dans l\'huile d\'olive", "Ajouter le riz et faire revenir 2 minutes", "Ajouter le vin blanc et laisser évaporer", "Ajouter le bouillon chaud progressivement en remuant", "Faire revenir les champignons séparément", "Mélanger le risotto avec les champignons et le parmesan"]',
 15, 25, 4, 420, 10.00, 'Italian', 'savory', TRUE, '["creamy", "vegetarian", "comfort"]', 'medium'),

('Tiramisu', 'Dessert italien classique au café',
 '["mascarpone", "œufs", "sucre", "café", "biscuits à la cuillère", "cacao"]',
 '["Séparer les blancs des jaunes d\'œufs", "Battre les jaunes avec le sucre", "Ajouter le mascarpone", "Monter les blancs en neige et les incorporer", "Tremper les biscuits dans le café", "Alterner couches de biscuits et crème", "Saupoudrer de cacao et réfrigérer"]',
 30, 0, 8, 320, 12.00, 'Italian', 'sweet', FALSE, '["dessert", "coffee", "classic"]', 'medium'),

('Gâteau au Chocolat', 'Gâteau moelleux au chocolat',
 '["chocolat", "beurre", "œufs", "sucre", "farine", "levure"]',
 '["Faire fondre le chocolat avec le beurre", "Battre les œufs avec le sucre", "Mélanger le chocolat fondu", "Ajouter la farine et la levure", "Verser dans un moule et cuire 25 minutes", "Laisser refroidir avant de démouler"]',
 15, 25, 8, 380, 8.00, 'French', 'sweet', FALSE, '["dessert", "chocolate", "baking"]', 'easy'),

('Salade de Fruits Fraîche', 'Salade de fruits de saison',
 '["pommes", "bananes", "fraises", "oranges", "miel", "menthe"]',
 '["Laver et couper tous les fruits", "Mélanger les fruits dans un saladier", "Arroser de miel", "Ajouter des feuilles de menthe", "Réfrigérer avant de servir"]',
 15, 0, 4, 120, 6.00, 'Mediterranean', 'sweet', TRUE, '["healthy", "fresh", "fruit"]', 'easy');

