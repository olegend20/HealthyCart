import { generateMealPlan } from './openai';

export interface RecipeCustomizationRequest {
  originalRecipe: {
    id: number;
    name: string;
    description: string;
    instructions: string;
    prepTime: number;
    cookTime: number;
    servings: number;
    difficulty: string;
    cuisine: string;
    tags: string[];
    nutritionFacts: any;
  };
  ingredients: Array<{
    id: number;
    name: string;
    amount: string;
    unit: string;
    category: string;
    optional: boolean;
  }>;
  modifications: string[];
  servingMultiplier: number;
}

export interface CustomizedRecipeResponse {
  name: string;
  description: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  tags: string[];
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    category: string;
    optional: boolean;
  }>;
  nutritionFacts: any;
}

export async function generateCustomizedRecipe(request: RecipeCustomizationRequest): Promise<CustomizedRecipeResponse> {
  console.log("Starting recipe customization for:", request.originalRecipe.name);
  console.log("Modifications requested:", request.modifications);
  console.log("Serving multiplier:", request.servingMultiplier);

  // Build modification description
  const modificationDescriptions = {
    'healthier': 'make it healthier by reducing calories, fat, or sodium',
    'vegetarian': 'make it vegetarian by removing meat ingredients',
    'vegan': 'make it vegan by removing all animal products',
    'gluten-free': 'make it gluten-free by replacing gluten-containing ingredients',
    'dairy-free': 'make it dairy-free by removing dairy products',
    'low-carb': 'make it low-carb by reducing carbohydrate content',
    'protein-boost': 'add more protein to increase protein content',
    'kid-friendly': 'make it kid-friendly by adjusting flavors for children',
    'spicier': 'make it spicier by adding heat and spice',
    'milder': 'make it milder by reducing strong flavors',
    'quicker': 'make it quicker by reducing preparation time',
    'budget-friendly': 'make it budget-friendly by using cheaper ingredients'
  };

  const modifications = request.modifications.map(mod => 
    modificationDescriptions[mod as keyof typeof modificationDescriptions] || mod
  ).join(', ');

  // Scale ingredients based on serving multiplier
  const scaledIngredients = request.ingredients.map(ingredient => {
    const scaledAmount = parseFloat(ingredient.amount) * request.servingMultiplier;
    return {
      ...ingredient,
      amount: scaledAmount.toString()
    };
  });

  // Create OpenAI prompt for recipe customization
  const customizationPrompt = `
You are a professional chef and recipe developer. I need you to customize an existing recipe based on specific modifications.

Original Recipe: "${request.originalRecipe.name}"
Description: ${request.originalRecipe.description}
Original Servings: ${request.originalRecipe.servings}
New Servings: ${Math.round(request.originalRecipe.servings * request.servingMultiplier)}
Prep Time: ${request.originalRecipe.prepTime} minutes
Cook Time: ${request.originalRecipe.cookTime} minutes
Difficulty: ${request.originalRecipe.difficulty}
Cuisine: ${request.originalRecipe.cuisine}

Original Ingredients:
${scaledIngredients.map(ing => `- ${ing.name}: ${ing.amount} ${ing.unit}`).join('\n')}

Original Instructions:
${request.originalRecipe.instructions}

MODIFICATIONS REQUESTED: ${modifications}

Please provide a customized version of this recipe that incorporates all the requested modifications. The response should be in the following JSON format:

{
  "name": "Updated recipe name",
  "description": "Updated description explaining the modifications",
  "instructions": "Step-by-step cooking instructions with modifications applied",
  "prepTime": estimated_prep_time_in_minutes,
  "cookTime": estimated_cook_time_in_minutes,
  "servings": ${Math.round(request.originalRecipe.servings * request.servingMultiplier)},
  "difficulty": "easy|medium|hard",
  "cuisine": "cuisine_type",
  "tags": ["tag1", "tag2", "tag3"],
  "ingredients": [
    {
      "name": "ingredient_name",
      "amount": "amount_as_number_string",
      "unit": "unit_of_measurement",
      "category": "produce|meat|dairy|pantry|spices|other",
      "optional": false
    }
  ],
  "nutritionFacts": {
    "calories": estimated_calories_per_serving,
    "protein": estimated_protein_grams,
    "carbs": estimated_carbs_grams,
    "fat": estimated_fat_grams,
    "fiber": estimated_fiber_grams
  }
}

Important guidelines:
- Keep the essence of the original recipe while applying modifications
- Update ingredient quantities proportionally for the new serving size
- Adjust cooking times if necessary based on modifications
- Update tags to reflect the modifications (e.g., add "vegetarian", "gluten-free", etc.)
- Ensure nutritional information reflects the changes
- Make sure all ingredients work together harmoniously
- Provide clear, step-by-step instructions that account for the modifications
`;

  try {
    // Use the existing OpenAI service to generate the customized recipe
    const openaiResponse = await generateMealPlan({
      householdMembers: [],
      cookingEquipment: [],
      duration: 1,
      goals: [`Customize recipe: ${modifications}`],
      mealTypes: ['custom'],
      customPrompt: customizationPrompt
    });

    console.log("OpenAI customization response received");

    // Parse the response - it should be a single customized recipe
    if (openaiResponse.meals && openaiResponse.meals.length > 0) {
      const customizedMeal = openaiResponse.meals[0];
      
      return {
        name: customizedMeal.name,
        description: customizedMeal.description || "Customized recipe",
        instructions: customizedMeal.instructions || "No instructions provided",
        prepTime: customizedMeal.prepTime || request.originalRecipe.prepTime,
        cookTime: customizedMeal.cookTime || request.originalRecipe.cookTime,
        servings: Math.round(request.originalRecipe.servings * request.servingMultiplier),
        difficulty: customizedMeal.difficulty || request.originalRecipe.difficulty,
        cuisine: customizedMeal.cuisine || request.originalRecipe.cuisine,
        tags: customizedMeal.tags || [...request.originalRecipe.tags, ...request.modifications],
        ingredients: customizedMeal.ingredients || scaledIngredients,
        nutritionFacts: customizedMeal.nutritionFacts || request.originalRecipe.nutritionFacts
      };
    }

    // Fallback: return scaled original recipe with modifications noted
    return {
      name: `${request.originalRecipe.name} (Modified)`,
      description: `${request.originalRecipe.description} - Modified: ${modifications}`,
      instructions: request.originalRecipe.instructions,
      prepTime: request.originalRecipe.prepTime,
      cookTime: request.originalRecipe.cookTime,
      servings: Math.round(request.originalRecipe.servings * request.servingMultiplier),
      difficulty: request.originalRecipe.difficulty,
      cuisine: request.originalRecipe.cuisine,
      tags: [...request.originalRecipe.tags, ...request.modifications],
      ingredients: scaledIngredients,
      nutritionFacts: request.originalRecipe.nutritionFacts
    };

  } catch (error) {
    console.error("Error in recipe customization:", error);
    
    // Fallback response in case of error
    return {
      name: `${request.originalRecipe.name} (Scaled)`,
      description: `${request.originalRecipe.description} - Scaled for ${Math.round(request.originalRecipe.servings * request.servingMultiplier)} servings`,
      instructions: request.originalRecipe.instructions,
      prepTime: request.originalRecipe.prepTime,
      cookTime: request.originalRecipe.cookTime,
      servings: Math.round(request.originalRecipe.servings * request.servingMultiplier),
      difficulty: request.originalRecipe.difficulty,
      cuisine: request.originalRecipe.cuisine,
      tags: request.originalRecipe.tags,
      ingredients: scaledIngredients,
      nutritionFacts: request.originalRecipe.nutritionFacts
    };
  }
}