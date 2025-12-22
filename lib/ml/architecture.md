# ML Architecture for NutriWise Recipe System

## Overview
Professional machine learning system with two main models:
1. **Classification Model**: Recommends recipes on homepage based on user profile
2. **Generation Model**: Generates personalized recipes during creation

## Architecture Design

### Model 1: Recipe Classification/Recommendation (Homepage)

**Purpose**: Classify and rank recipes based on user profile data

**Input Features**:
- User demographics (age, gender, activity level)
- Dietary preferences (vegetarian, vegan, keto, etc.)
- Allergies (one-hot encoded)
- Health conditions
- Historical interactions (views, likes, saves)

**Output**: 
- Probability scores for each recipe class
- Top-K recipe recommendations

**Architecture**:
```
Input Layer (User Features: ~50-100 dims)
    ↓
Dense Layer 1 (128 units, ReLU, Dropout 0.3)
    ↓
Dense Layer 2 (64 units, ReLU, Dropout 0.2)
    ↓
Dense Layer 3 (32 units, ReLU)
    ↓
Output Layer (N recipes, Softmax)
```

**Training**:
- Loss: Categorical Crossentropy
- Optimizer: Adam (lr=0.001)
- Metrics: Accuracy, Precision, Recall, F1-Score
- Validation Split: 20%
- Early Stopping: Patience=10 epochs

### Model 2: Recipe Generation (Creation)

**Purpose**: Generate personalized recipes based on available ingredients and preferences

**Input Features**:
- Available ingredients (one-hot encoded, ~500+ ingredients)
- Recipe type (sweet/savory)
- Cuisine type (one-hot encoded)
- Health preference (healthy/indulgent)
- Budget constraint
- Allergies (negative encoding)

**Output**:
- Recipe template ID (classification)
- Missing ingredients prediction
- Estimated price
- Preparation steps sequence

**Architecture** (Hybrid Approach):
```
Part 1: Ingredient Matching (Content-Based Filtering)
    ↓
Cosine Similarity Layer
    ↓
Feature Fusion Layer
    ↓
Part 2: Deep Neural Network
Input: Combined Features (~600 dims)
    ↓
Dense Layer 1 (256 units, ReLU, Dropout 0.3)
    ↓
Dense Layer 2 (128 units, ReLU, Dropout 0.2)
    ↓
Dense Layer 3 (64 units, ReLU)
    ↓
Output Layer 1: Recipe ID (Softmax, N recipes)
Output Layer 2: Missing Ingredients (Sigmoid, M ingredients)
Output Layer 3: Price Estimation (Linear, 1 value)
```

**Training**:
- Multi-task learning with weighted loss
- Recipe Classification: 60% weight
- Missing Ingredients: 25% weight  
- Price Estimation: 15% weight
- Optimizer: Adam (lr=0.0005)
- Batch Size: 32
- Epochs: 100 with early stopping

## Feature Engineering

### User Profile Features
- Age: Normalized (0-1)
- Gender: One-hot (male, female)
- Activity Level: One-hot (5 levels)
- Dietary Preference: One-hot (6 types)
- Allergies: Multi-hot encoding (10+ allergens)
- Health Conditions: Multi-hot encoding

### Recipe Features
- Ingredients: One-hot encoding (vocabulary of 500+ ingredients)
- Cuisine Type: One-hot (10+ cuisines)
- Recipe Type: Binary (sweet/savory)
- Nutritional: Normalized (calories, prep_time, cook_time)
- Price: Normalized
- Tags: Multi-hot encoding

### Interaction Features
- View count (normalized)
- Like ratio
- Save ratio
- Average rating

## Dataset Requirements

### Minimum Dataset Size
- **Training**: 500+ recipes
- **Validation**: 100+ recipes
- **Test**: 50+ recipes

### Data Diversity Requirements
- At least 10 different cuisines
- Balanced sweet/savory ratio (50/50)
- Balanced healthy/non-healthy (40/60)
- Multiple difficulty levels
- Wide price range ($3-$25)
- Various preparation times (5-180 min)

## Model Evaluation Metrics

### Classification Model
- **Accuracy**: Overall correctness
- **Precision@K**: Top-K precision
- **Recall@K**: Top-K recall
- **F1-Score**: Harmonic mean
- **NDCG@K**: Normalized Discounted Cumulative Gain

### Generation Model
- **Recipe Match Accuracy**: Correct recipe selection
- **Ingredient Prediction F1**: Missing ingredients accuracy
- **Price MAE**: Mean Absolute Error for price
- **User Satisfaction**: Implicit feedback (saves, likes)

## Training Pipeline

1. **Data Loading**: Load from `recipe_templates` table
2. **Feature Extraction**: Extract and normalize features
3. **Data Splitting**: Train/Validation/Test (70/15/15)
4. **Model Training**: Train with validation monitoring
5. **Model Evaluation**: Evaluate on test set
6. **Model Saving**: Save to `ml_models` table
7. **Model Deployment**: Activate best model

## Inference Pipeline

1. **User Request**: Extract user preferences
2. **Feature Extraction**: Convert to model input format
3. **Model Prediction**: Get recipe scores/predictions
4. **Post-Processing**: Filter by constraints (allergies, budget)
5. **Ranking**: Sort by score and relevance
6. **Return**: Top-K recommendations

## Continuous Learning

- **Feedback Loop**: Track user interactions
- **Retraining**: Weekly/monthly retraining with new data
- **A/B Testing**: Compare model versions
- **Performance Monitoring**: Track metrics over time

