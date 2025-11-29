-- Script pour créer/corriger l'utilisateur MySQL pour NutriWise
-- Exécutez avec: sudo mysql < fix_mysql_user.sql

-- Supprimer l'utilisateur s'il existe déjà (pour recommencer proprement)
DROP USER IF EXISTS 'nutriwise_user'@'localhost';

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur avec mot de passe
CREATE USER 'nutriwise_user'@'localhost' IDENTIFIED BY 'nutriwise_password_123';

-- Accorder tous les privilèges sur la base de données
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise_user'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier que l'utilisateur existe
SELECT user, host FROM mysql.user WHERE user='nutriwise_user';

-- Utiliser la base de données
USE nutriwise;

-- Créer les tables si elles n'existent pas
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  age INT,
  gender ENUM('male', 'female', 'other'),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very_active'),
  dietary_preference ENUM('healthy', 'normal', 'vegetarian', 'vegan', 'keto', 'paleo'),
  allergies TEXT,
  health_conditions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_profile (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  prep_time INT,
  cook_time INT,
  servings INT,
  calories INT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  total_users INT DEFAULT 0,
  total_recipes INT DEFAULT 0,
  total_meals_planned INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les stats initiales
INSERT INTO site_stats (total_users, total_recipes, total_meals_planned) 
VALUES (0, 0, 0) 
ON DUPLICATE KEY UPDATE id=id;

-- Vérifier les tables créées
SHOW TABLES;

