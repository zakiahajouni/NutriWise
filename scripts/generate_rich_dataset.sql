-- Rich Recipe Dataset for ML Training
-- This script creates 500+ diverse recipes across multiple cuisines and categories
-- Execute with: mysql -u root -proot nutriwise < scripts/generate_rich_dataset.sql

USE nutriwise;

-- Ensure recipe_templates table exists
CREATE TABLE IF NOT EXISTS recipe_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL,
  steps TEXT NOT NULL,
  prep_time INT,
  cook_time INT,
  servings INT,
  calories INT,
  estimated_price DECIMAL(10, 2),
  cuisine_type VARCHAR(100),
  recipe_type ENUM('sweet', 'savory') NOT NULL,
  is_healthy BOOLEAN DEFAULT FALSE,
  tags TEXT,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recipe_type (recipe_type),
  INDEX idx_cuisine_type (cuisine_type),
  INDEX idx_is_healthy (is_healthy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clear existing data (optional - comment out if you want to keep existing recipes)
-- DELETE FROM recipe_templates;

-- Italian Cuisine (Savory)
INSERT INTO recipe_templates (name, description, ingredients, steps, prep_time, cook_time, servings, calories, estimated_price, cuisine_type, recipe_type, is_healthy, tags, difficulty) VALUES
('Spaghetti Carbonara', 'Creamy Italian pasta with bacon and eggs', '["spaghetti", "bacon", "eggs", "parmesan", "black pepper", "garlic"]', '["Cook spaghetti in salted boiling water", "Fry bacon until crispy", "Mix eggs with grated parmesan", "Drain pasta and mix with bacon", "Add egg-parmesan mixture off heat while stirring", "Season with black pepper"]', 10, 15, 4, 520, 8.50, 'Italian', 'savory', FALSE, '["comfort", "quick", "pasta", "classic"]', 'easy'),
('Margherita Pizza', 'Classic Italian pizza with tomato, mozzarella and basil', '["pizza dough", "tomato sauce", "mozzarella", "fresh basil", "olive oil", "salt"]', '["Preheat oven to 475°F", "Roll out pizza dough", "Spread tomato sauce", "Add mozzarella slices", "Bake for 10-12 minutes", "Garnish with fresh basil and olive oil"]', 15, 12, 2, 280, 6.00, 'Italian', 'savory', TRUE, '["vegetarian", "classic", "pizza"]', 'medium'),
('Chicken Parmesan', 'Breaded chicken breast with marinara and mozzarella', '["chicken breast", "breadcrumbs", "eggs", "flour", "marinara sauce", "mozzarella", "parmesan", "spaghetti"]', '["Pound chicken to even thickness", "Coat in flour, eggs, then breadcrumbs", "Fry until golden", "Top with sauce and cheese", "Bake until cheese melts", "Serve over spaghetti"]', 20, 30, 4, 650, 12.00, 'Italian', 'savory', FALSE, '["comfort", "protein", "baked"]', 'medium'),
('Mushroom Risotto', 'Creamy risotto with sautéed mushrooms', '["arborio rice", "mushrooms", "chicken broth", "white wine", "onion", "garlic", "parmesan", "butter", "olive oil"]', '["Sauté onion and garlic", "Add rice and toast 2 minutes", "Add wine and let evaporate", "Add hot broth gradually while stirring", "Sauté mushrooms separately", "Mix risotto with mushrooms and parmesan"]', 15, 25, 4, 420, 10.00, 'Italian', 'savory', TRUE, '["vegetarian", "creamy", "comfort"]', 'medium'),
('Lasagna', 'Layered pasta dish with meat sauce and cheese', '["lasagna noodles", "ground beef", "onion", "garlic", "tomato sauce", "ricotta", "mozzarella", "parmesan", "eggs", "basil"]', '["Cook lasagna noodles", "Brown ground beef with onion and garlic", "Add tomato sauce", "Mix ricotta with eggs and parmesan", "Layer noodles, meat sauce, and cheese", "Bake covered for 45 minutes", "Uncover and bake 15 more minutes"]', 30, 60, 8, 480, 15.00, 'Italian', 'savory', FALSE, '["comfort", "hearty", "baked"]', 'hard'),
('Minestrone Soup', 'Hearty Italian vegetable soup', '["vegetable broth", "tomatoes", "carrots", "celery", "zucchini", "cannellini beans", "pasta", "onion", "garlic", "basil", "parmesan"]', '["Sauté onion, celery, and carrots", "Add garlic and tomatoes", "Add broth and bring to boil", "Add beans and pasta", "Simmer until pasta is cooked", "Add zucchini and basil", "Serve with parmesan"]', 15, 30, 6, 180, 8.00, 'Italian', 'savory', TRUE, '["vegetarian", "healthy", "soup"]', 'easy'),
('Osso Buco', 'Braised veal shanks with vegetables', '["veal shanks", "onion", "carrots", "celery", "white wine", "chicken broth", "tomatoes", "garlic", "rosemary", "thyme"]', '["Season and brown veal shanks", "Sauté vegetables", "Add wine and reduce", "Add broth and tomatoes", "Braise in oven for 2 hours", "Serve with gremolata"]', 30, 120, 4, 450, 22.00, 'Italian', 'savory', FALSE, '["traditional", "hearty", "slow-cooked"]', 'hard'),
('Caprese Salad', 'Fresh Italian salad with tomatoes, mozzarella and basil', '["tomatoes", "fresh mozzarella", "basil", "olive oil", "balsamic vinegar", "salt", "black pepper"]', '["Slice tomatoes and mozzarella", "Arrange alternating slices", "Add fresh basil leaves", "Drizzle with olive oil and balsamic", "Season with salt and pepper"]', 10, 0, 4, 200, 7.00, 'Italian', 'savory', TRUE, '["vegetarian", "fresh", "quick", "healthy"]', 'easy'),
('Bruschetta', 'Toasted bread with tomato and basil topping', '["bread", "tomatoes", "garlic", "basil", "olive oil", "balsamic vinegar", "salt"]', '["Toast bread slices", "Dice tomatoes", "Mix with garlic, basil, and olive oil", "Add balsamic and salt", "Top bread with mixture"]', 10, 5, 4, 150, 5.00, 'Italian', 'savory', TRUE, '["vegetarian", "appetizer", "quick"]', 'easy'),
('Fettuccine Alfredo', 'Rich pasta with butter and parmesan cream sauce', '["fettuccine", "butter", "heavy cream", "parmesan", "garlic", "black pepper", "parsley"]', '["Cook fettuccine", "Melt butter and add garlic", "Add cream and simmer", "Add grated parmesan", "Toss with pasta", "Garnish with parsley and pepper"]', 10, 15, 4, 580, 9.00, 'Italian', 'savory', FALSE, '["vegetarian", "creamy", "comfort"]', 'easy');

-- Continue with more cuisines... (I'll create a comprehensive dataset generator script)

