#!/usr/bin/env python3
"""
Script to generate a rich JSON dataset with 500+ recipes
All prices are in Tunisian Dinar (TND)
Run with: python3 scripts/generate_rich_json_dataset.py
"""

import json
import random

# Conversion rate: 1 USD = 3.1 TND (approximate)
USD_TO_TND = 3.1

# Base recipe templates by cuisine
CUISINE_TEMPLATES = {
    "italian": {
        "savory": [
            {"name": "Spaghetti Carbonara", "base_calories": 520, "base_price": 8.50},
            {"name": "Margherita Pizza", "base_calories": 280, "base_price": 6.00},
            {"name": "Chicken Parmesan", "base_calories": 650, "base_price": 12.00},
            {"name": "Mushroom Risotto", "base_calories": 420, "base_price": 10.00},
            {"name": "Lasagna", "base_calories": 480, "base_price": 15.00},
            {"name": "Minestrone Soup", "base_calories": 180, "base_price": 8.00},
            {"name": "Osso Buco", "base_calories": 450, "base_price": 22.00},
            {"name": "Caprese Salad", "base_calories": 200, "base_price": 7.00},
            {"name": "Bruschetta", "base_calories": 150, "base_price": 5.00},
            {"name": "Fettuccine Alfredo", "base_calories": 580, "base_price": 9.00},
            {"name": "Penne Arrabbiata", "base_calories": 380, "base_price": 7.50},
            {"name": "Chicken Marsala", "base_calories": 420, "base_price": 14.00},
            {"name": "Eggplant Parmesan", "base_calories": 320, "base_price": 11.00},
            {"name": "Risotto ai Funghi", "base_calories": 450, "base_price": 12.00},
            {"name": "Gnocchi", "base_calories": 320, "base_price": 9.00},
            {"name": "Pesto Pasta", "base_calories": 420, "base_price": 8.00},
            {"name": "Arancini", "base_calories": 280, "base_price": 8.00},
        ],
        "sweet": [
            {"name": "Tiramisu", "base_calories": 320, "base_price": 12.00},
            {"name": "Panna Cotta", "base_calories": 280, "base_price": 8.00},
            {"name": "Cannoli", "base_calories": 180, "base_price": 10.00},
            {"name": "Gelato", "base_calories": 220, "base_price": 7.00},
            {"name": "Zabaglione", "base_calories": 180, "base_price": 6.00},
        ]
    },
    "tunisian": {
        "savory": [
            {"name": "Tunisian Couscous", "base_calories": 450, "base_price": 15.00},
            {"name": "Brik", "base_calories": 320, "base_price": 8.00},
            {"name": "Lablabi", "base_calories": 250, "base_price": 6.00},
            {"name": "Tajine", "base_calories": 280, "base_price": 7.00},
            {"name": "Ojja", "base_calories": 220, "base_price": 6.50},
            {"name": "Chorba", "base_calories": 280, "base_price": 9.00},
        ],
        "sweet": [
            {"name": "Makroudh", "base_calories": 120, "base_price": 7.00},
            {"name": "Zalabia", "base_calories": 180, "base_price": 6.00},
        ]
    },
    "french": {
        "savory": [
            {"name": "Coq au Vin", "base_calories": 480, "base_price": 18.00},
            {"name": "Ratatouille", "base_calories": 150, "base_price": 9.00},
            {"name": "Bouillabaisse", "base_calories": 350, "base_price": 20.00},
            {"name": "Beef Bourguignon", "base_calories": 520, "base_price": 22.00},
            {"name": "Quiche Lorraine", "base_calories": 380, "base_price": 11.00},
        ],
        "sweet": [
            {"name": "Chocolate Cake", "base_calories": 380, "base_price": 8.00},
            {"name": "Crème Brûlée", "base_calories": 320, "base_price": 10.00},
            {"name": "Macarons", "base_calories": 80, "base_price": 15.00},
        ]
    },
    "thai": {
        "savory": [
            {"name": "Pad Thai", "base_calories": 420, "base_price": 10.00},
            {"name": "Green Curry", "base_calories": 380, "base_price": 11.00},
            {"name": "Tom Yum Soup", "base_calories": 180, "base_price": 9.00},
            {"name": "Som Tam", "base_calories": 150, "base_price": 6.00},
            {"name": "Massaman Curry", "base_calories": 450, "base_price": 13.00},
            {"name": "Pad See Ew", "base_calories": 380, "base_price": 9.50},
        ],
        "sweet": [
            {"name": "Mango Sticky Rice", "base_calories": 320, "base_price": 7.00},
        ]
    },
    "chinese": {
        "savory": [
            {"name": "Kung Pao Chicken", "base_calories": 380, "base_price": 12.00},
            {"name": "Sweet and Sour Pork", "base_calories": 450, "base_price": 13.00},
            {"name": "Mapo Tofu", "base_calories": 280, "base_price": 10.00},
            {"name": "Peking Duck", "base_calories": 520, "base_price": 25.00},
            {"name": "Egg Fried Rice", "base_calories": 320, "base_price": 8.00},
            {"name": "General Tso's Chicken", "base_calories": 420, "base_price": 12.50},
        ],
        "sweet": [
            {"name": "Mango Pudding", "base_calories": 180, "base_price": 7.00},
        ]
    },
    "japanese": {
        "savory": [
            {"name": "Sushi Rolls", "base_calories": 280, "base_price": 15.00},
            {"name": "Ramen", "base_calories": 520, "base_price": 12.00},
            {"name": "Teriyaki Chicken", "base_calories": 350, "base_price": 11.00},
            {"name": "Miso Soup", "base_calories": 80, "base_price": 5.00},
            {"name": "Tempura", "base_calories": 380, "base_price": 14.00},
        ],
        "sweet": [
            {"name": "Mochi", "base_calories": 120, "base_price": 8.00},
        ]
    },
    "spanish": {
        "savory": [
            {"name": "Paella", "base_calories": 450, "base_price": 18.00},
            {"name": "Gazpacho", "base_calories": 120, "base_price": 6.00},
            {"name": "Tortilla Española", "base_calories": 280, "base_price": 7.00},
            {"name": "Patatas Bravas", "base_calories": 320, "base_price": 7.00},
        ],
        "sweet": [
            {"name": "Churros", "base_calories": 250, "base_price": 6.00},
            {"name": "Flan", "base_calories": 220, "base_price": 8.00},
        ]
    },
    "middle_eastern": {
        "savory": [
            {"name": "Hummus", "base_calories": 180, "base_price": 5.00},
            {"name": "Falafel", "base_calories": 250, "base_price": 6.00},
            {"name": "Shawarma", "base_calories": 420, "base_price": 10.00},
            {"name": "Tabbouleh", "base_calories": 150, "base_price": 7.00},
        ],
        "sweet": [
            {"name": "Baklava", "base_calories": 280, "base_price": 12.00},
            {"name": "Knafeh", "base_calories": 320, "base_price": 11.00},
        ]
    },
    "indian": {
        "savory": [
            {"name": "Chicken Curry", "base_calories": 380, "base_price": 11.00},
            {"name": "Butter Chicken", "base_calories": 450, "base_price": 13.00},
            {"name": "Biryani", "base_calories": 520, "base_price": 16.00},
        ],
        "sweet": [
            {"name": "Gulab Jamun", "base_calories": 180, "base_price": 7.00},
        ]
    },
    "mexican": {
        "savory": [
            {"name": "Chicken Tacos", "base_calories": 350, "base_price": 9.00},
            {"name": "Guacamole", "base_calories": 200, "base_price": 6.00},
            {"name": "Enchiladas", "base_calories": 420, "base_price": 11.00},
        ],
        "sweet": [
            {"name": "Churros", "base_calories": 250, "base_price": 6.00},
        ]
    },
    "american": {
        "savory": [
            {"name": "Caesar Salad", "base_calories": 380, "base_price": 12.00},
            {"name": "BBQ Ribs", "base_calories": 650, "base_price": 18.00},
        ],
        "sweet": [
            {"name": "Apple Pie", "base_calories": 320, "base_price": 9.00},
        ]
    },
    "greek": {
        "savory": [
            {"name": "Greek Salad", "base_calories": 220, "base_price": 8.00},
            {"name": "Moussaka", "base_calories": 450, "base_price": 15.00},
            {"name": "Souvlaki", "base_calories": 420, "base_price": 11.00},
        ],
        "sweet": [
            {"name": "Baklava", "base_calories": 280, "base_price": 12.00},
        ]
    },
    "moroccan": {
        "savory": [
            {"name": "Tagine", "base_calories": 450, "base_price": 16.00},
            {"name": "Couscous", "base_calories": 420, "base_price": 14.00},
        ],
        "sweet": [
            {"name": "Chebakia", "base_calories": 120, "base_price": 8.00},
        ]
    },
    "turkish": {
        "savory": [
            {"name": "Kebab", "base_calories": 420, "base_price": 14.00},
        ],
        "sweet": [
            {"name": "Turkish Delight", "base_calories": 150, "base_price": 9.00},
        ]
    },
    "brazilian": {
        "savory": [
            {"name": "Feijoada", "base_calories": 520, "base_price": 14.00},
        ],
        "sweet": [
            {"name": "Brigadeiro", "base_calories": 100, "base_price": 6.00},
        ]
    },
    "british": {
        "savory": [
            {"name": "Fish and Chips", "base_calories": 650, "base_price": 12.00},
            {"name": "Shepherd's Pie", "base_calories": 420, "base_price": 11.00},
        ],
        "sweet": [
            {"name": "Sticky Toffee Pudding", "base_calories": 420, "base_price": 10.00},
        ]
    }
}

# Common ingredients by cuisine
CUISINE_INGREDIENTS = {
    "italian": ["pasta", "tomatoes", "garlic", "olive oil", "basil", "parmesan", "mozzarella"],
    "tunisian": ["couscous", "harissa", "chickpeas", "cumin", "coriander", "lamb"],
    "french": ["butter", "wine", "cream", "herbs", "onion", "garlic"],
    "thai": ["coconut milk", "lemongrass", "lime", "fish sauce", "chili", "basil"],
    "chinese": ["soy sauce", "ginger", "garlic", "rice", "scallions", "sesame oil"],
    "japanese": ["rice", "soy sauce", "miso", "nori", "ginger", "wasabi"],
    "spanish": ["olive oil", "saffron", "rice", "tomatoes", "garlic", "paprika"],
    "middle_eastern": ["chickpeas", "tahini", "lemon", "olive oil", "cumin", "parsley"],
    "indian": ["curry spices", "coconut milk", "ginger", "garlic", "cilantro", "yogurt"],
    "mexican": ["tortillas", "chili", "cilantro", "lime", "cumin", "tomatoes"],
    "american": ["chicken", "lettuce", "cheese", "bacon", "potatoes"],
    "greek": ["olive oil", "feta", "olives", "lemon", "oregano", "tomatoes"],
    "moroccan": ["couscous", "saffron", "cinnamon", "apricots", "almonds"],
    "turkish": ["lamb", "yogurt", "cumin", "paprika", "pita"],
    "brazilian": ["black beans", "rice", "coconut", "lime"],
    "british": ["potatoes", "peas", "butter", "beef", "onion"]
}

def generate_recipe_variations(base_template, cuisine, recipe_type, recipe_id):
    """Generate multiple variations of a recipe"""
    variations = []
    
    # Generate 2-4 variations per base template
    num_variations = random.randint(2, 4)
    
    for i in range(num_variations):
        variation = base_template.copy()
        variation["id"] = recipe_id + i
        variation["cuisine"] = cuisine
        variation["recipeType"] = recipe_type
        
        # Add variation suffix
        if i > 0:
            variation["name"] = f"{base_template['name']} (Variation {i+1})"
        
        # Vary calories and price slightly
        variation["calories"] = base_template["base_calories"] + random.randint(-50, 50)
        # Convert USD to TND and vary slightly
        base_price_tnd = base_template["base_price"] * USD_TO_TND
        variation["estimatedPrice"] = round(base_price_tnd + random.uniform(-5, 5), 2)
        
        # Generate ingredients
        base_ingredients = CUISINE_INGREDIENTS.get(cuisine, [])
        num_ingredients = random.randint(5, 10)
        variation["ingredients"] = random.sample(base_ingredients, min(num_ingredients, len(base_ingredients)))
        
        # Generate steps
        num_steps = random.randint(4, 8)
        variation["steps"] = [f"Step {j+1} for {variation['name']}" for j in range(num_steps)]
        
        # Set other properties
        variation["isHealthy"] = variation["calories"] < 400
        variation["difficulty"] = random.choice(["easy", "medium", "hard"])
        variation["prepTime"] = random.randint(10, 45)
        variation["cookTime"] = random.randint(10, 120)
        variation["servings"] = random.choice([2, 4, 6, 8])
        variation["tags"] = random.sample(["comfort", "quick", "traditional", "spicy", "healthy", "protein"], 
                                         random.randint(2, 4))
        variation["description"] = f"Delicious {cuisine} {recipe_type} dish"
        
        # Remove base_ fields
        variation.pop("base_calories", None)
        variation.pop("base_price", None)
        
        variations.append(variation)
    
    return variations

def generate_dataset():
    """Generate complete dataset with 500+ recipes"""
    all_recipes = []
    recipe_id = 1
    
    for cuisine, types in CUISINE_TEMPLATES.items():
        for recipe_type, templates in types.items():
            for template in templates:
                variations = generate_recipe_variations(template, cuisine, recipe_type, recipe_id)
                all_recipes.extend(variations)
                recipe_id += len(variations)
    
    # Ensure we have at least 500 recipes
    while len(all_recipes) < 500:
        # Duplicate and modify some recipes
        base_recipe = random.choice(all_recipes).copy()
        base_recipe["id"] = recipe_id
        base_recipe["name"] = f"{base_recipe['name']} (Copy {recipe_id})"
        base_recipe["calories"] += random.randint(-30, 30)
        base_recipe["estimatedPrice"] = round(base_recipe["estimatedPrice"] + random.uniform(-3, 3), 2)
        all_recipes.append(base_recipe)
        recipe_id += 1
    
    return {"recipes": all_recipes[:500]}

if __name__ == "__main__":
    dataset = generate_dataset()
    
    output_file = "data/recipes_dataset.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated {len(dataset['recipes'])} recipes")
    print(f"✅ Saved to {output_file}")
    
    # Print statistics
    cuisines = {}
    for recipe in dataset['recipes']:
        cuisine = recipe['cuisine']
        cuisines[cuisine] = cuisines.get(cuisine, 0) + 1
    
    print("\n📊 Statistics:")
    print(f"Total recipes: {len(dataset['recipes'])}")
    print(f"Unique cuisines: {len(cuisines)}")
    for cuisine, count in sorted(cuisines.items()):
        print(f"  {cuisine}: {count} recipes")

