# Poster Introduction - NutriWise Project

## General Introduction

In an era where personalized nutrition and dietary preferences are becoming increasingly important, intelligent food recommendation systems have emerged as essential tools for enhancing culinary experiences. This project presents NutriWise, an advanced machine learning-based system that combines recipe recommendation and generation capabilities to provide users with personalized culinary solutions. The system employs two specialized deep neural network models: a classification model for recommending existing recipes from a dataset of 8,000 recipes, and a generation model for creating personalized recipes based on available ingredients and user preferences. Built using TensorFlow/Keras framework, NutriWise processes 137-dimensional feature vectors incorporating user demographics, dietary restrictions, allergies, ingredient availability, and culinary preferences. The classification model, with 1,266,880 parameters, achieves target accuracy above 75% for recipe recommendations, while the generation model, with 763,136 parameters, generates contextually appropriate recipes that match user constraints. This work demonstrates the effectiveness of deep learning approaches in food recommendation systems, addressing key challenges such as scalability, personalization, and real-time performance, ultimately providing users with intelligent, adaptive, and user-centric culinary assistance.

---

## Version Alternative (Plus Courte)

NutriWise is an intelligent recipe recommendation and generation system powered by deep learning techniques. The system utilizes two specialized neural network models to provide personalized culinary experiences: a classification model for recommending recipes from a dataset of 8,000 recipes, and a generation model for creating custom recipes based on available ingredients. Implemented using TensorFlow/Keras, both models process comprehensive user profiles including dietary preferences, allergies, and ingredient availability through 137-dimensional feature vectors. With over 1.2 million parameters for classification and 763,000 for generation, the system demonstrates the potential of deep learning in creating scalable, accurate, and user-centric food recommendation platforms.

---

## Version Alternative (Plus Technique)

This research presents NutriWise, a dual-model deep learning architecture for intelligent recipe recommendation and generation. The system addresses the challenge of personalized food recommendation by implementing two complementary neural network models: a multi-class classification model (1,266,880 parameters) for recipe recommendation and a generation model (763,136 parameters) for personalized recipe creation. Both models are trained on a comprehensive dataset of 8,000 recipes, processing 137-dimensional feature vectors that encode user demographics, dietary constraints, ingredient availability, and culinary preferences. The classification model employs a [512, 256, 128] architecture with dropout regularization (0.4) and batch normalization, achieving target accuracy above 75% for multi-class classification across 8,000 recipe classes. The generation model utilizes a deeper [512, 256, 128, 64] architecture optimized for creative recipe generation. This work demonstrates the scalability and effectiveness of deep neural networks in food recommendation systems, providing real-time personalized culinary assistance with sub-500ms response times.

