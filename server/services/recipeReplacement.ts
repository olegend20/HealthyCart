import { storage } from "../storage";
import OpenAI from "openai";
import { 
  type InsertRecipe, 
  type InsertRecipeIngredient,
  type InsertGroceryListItem,
  type Recipe,
  type RecipeIngredient,
  type HouseholdMember,
  type MealPlan
} from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RecipeReplacementRequest {
  userId: string;
  mealId: number;
  currentRecipeId: number;
  mealPlanId: number;
  mealType: string;
  servings: number;
  rejectionReason?: string;
}

export interface RecipeReplacementResponse {
  newRecipe: {
    id: number;
    name: string;
    description: string;
    instructions: string;
    prepTime: number;
    cookTime: number;
    difficulty: string;
    cuisine: string;
    tags: string[];
    nutritionFacts: any;
    imageUrl?: string;
  };
  ingredients: Array<{
    id: number;
    name: string;
    amount: string;
    unit: string;
    category: string;
    optional: boolean;
  }>;
}

export async function replaceRecipeWithAI(request: RecipeReplacementRequest): Promise<RecipeReplacementResponse> {
  try {
    console.log("Starting recipe replacement for meal:", request.mealId);

    // Get meal plan and household member preferences
    const mealPlan = await storage.getMealPlan(request.mealPlanId, request.userId);
    const householdMembers = await storage.getHouseholdMembers(request.userId);
    const currentRecipe = await storage.getRecipe(request.currentRecipeId);

    if (!mealPlan || !currentRecipe) {
      throw new Error("Meal plan or current recipe not found");
    }

    // Build dietary preferences and restrictions
    const dietaryInfo = {
      restrictions: [] as string[],
      allergies: [] as string[],
      preferences: [] as string[],
      dislikes: [] as string[]
    };

    householdMembers.forEach(member => {
      if (member.dietaryRestrictions) {
        dietaryInfo.restrictions.push(...member.dietaryRestrictions);
      }
      if (member.allergies) {
        dietaryInfo.allergies.push(...member.allergies);
      }
      if (member.preferences) {
        dietaryInfo.preferences.push(...member.preferences);
      }
      if (member.dislikes) {
        dietaryInfo.dislikes.push(...member.dislikes);
      }
    });

    // Generate new recipe with OpenAI
    const prompt = `Generate a new ${request.mealType} recipe that replaces the rejected recipe "${currentRecipe.name}".

REQUIREMENTS:
- Must serve ${request.servings} people
- Must align with meal plan goals: ${mealPlan.goals.join(', ')}
- Must be different from the rejected recipe
- Consider dietary restrictions: ${dietaryInfo.restrictions.join(', ') || 'None'}
- Consider allergies: ${dietaryInfo.allergies.join(', ') || 'None'}
- Consider preferences: ${dietaryInfo.preferences.join(', ') || 'None'}
- Avoid dislikes: ${dietaryInfo.dislikes.join(', ') || 'None'}
${request.rejectionReason ? `- User feedback: ${request.rejectionReason}` : ''}

Provide a recipe with complete cooking instructions, ingredients list, and nutrition information.

Return JSON in this exact format:
{
  "recipe": {
    "name": "Recipe Name",
    "description": "Brief description",
    "instructions": "Step-by-step cooking instructions with numbered steps",
    "prepTime": 15,
    "cookTime": 30,
    "difficulty": "easy|medium|hard",
    "cuisine": "cuisine type",
    "tags": ["tag1", "tag2", "tag3"],
    "nutritionFacts": {
      "calories": 350,
      "protein": 25,
      "carbs": 30,
      "fat": 12,
      "fiber": 8
    }
  },
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "1",
      "unit": "cup",
      "category": "protein|vegetable|grain|dairy|spice|other",
      "optional": false
    }
  ]

IMPORTANT: For ingredient amounts, use specific measurements like "1", "2", "1/2", "1/4" instead of vague terms like "to taste" or "as needed". If seasoning, use "1 tsp" or "1/4 tsp" instead of "to taste".
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional chef and nutrition expert. Generate healthy, delicious recipes that meet specific dietary requirements. Always provide complete cooking instructions and accurate nutrition information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8 // Higher temperature for more creative alternatives
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');

    // Create new recipe in database
    const recipeData: InsertRecipe = {
      name: aiResponse.recipe.name,
      description: aiResponse.recipe.description,
      instructions: aiResponse.recipe.instructions,
      prepTime: aiResponse.recipe.prepTime,
      cookTime: aiResponse.recipe.cookTime,
      servings: request.servings,
      difficulty: aiResponse.recipe.difficulty,
      cuisine: aiResponse.recipe.cuisine,
      tags: aiResponse.recipe.tags,
      nutritionFacts: aiResponse.recipe.nutritionFacts,
    };

    const newRecipe = await storage.createRecipe(recipeData);
    console.log("Created new recipe:", newRecipe.id);

    // Create ingredients
    const ingredientsData: RecipeIngredient[] = [];
    for (const ing of aiResponse.ingredients) {
      const ingredientData: InsertRecipeIngredient = {
        recipeId: newRecipe.id,
        name: ing.name,
        amount: String(ing.amount), // Ensure amount is stored as string
        unit: ing.unit,
        category: ing.category,
        optional: ing.optional || false
      };
      
      const ingredient = await storage.createRecipeIngredient(ingredientData);
      ingredientsData.push(ingredient);
    }

    // Update the meal to use the new recipe
    await storage.updateMeal(request.mealId, { recipeId: newRecipe.id });

    // Update grocery list to reflect the new recipe ingredients
    await updateGroceryListForReplacedRecipe(request.mealPlanId, request.currentRecipeId, newRecipe.id, ingredientsData);

    console.log("Recipe replacement completed successfully");

    return {
      newRecipe,
      ingredients: ingredientsData
    };

  } catch (error) {
    console.error("Error replacing recipe:", error);
    throw new Error("Failed to replace recipe");
  }
}

async function updateGroceryListForReplacedRecipe(
  mealPlanId: number, 
  oldRecipeId: number, 
  newRecipeId: number, 
  newIngredients: RecipeIngredient[]
) {
  try {
    // Get all meals for this meal plan to rebuild the grocery list
    const meals = await storage.getMeals(mealPlanId);
    if (meals.length === 0) {
      console.log("No meals found for meal plan");
      return;
    }

    // Get the grocery list for this meal plan
    const groceryLists = await storage.getGroceryLists(mealPlanId);
    if (groceryLists.length === 0) {
      console.log("No grocery list found for meal plan");
      return;
    }

    const groceryList = groceryLists[0];

    // Create consolidated ingredient map from all current meals
    const ingredientMap = new Map<string, {
      name: string;
      amount: number;
      unit: string;
      category: string;
      estimatedPrice: number;
    }>();

    // Process ingredients from all meals (including the replaced one)
    for (const meal of meals) {
      const recipeId = meal.recipeId === oldRecipeId ? newRecipeId : meal.recipeId;
      const ingredients = recipeId === newRecipeId ? newIngredients : await storage.getRecipeIngredients(recipeId);
      
      ingredients.forEach(ingredient => {
        const key = ingredient.name.toLowerCase();
        const amount = parseFloat(ingredient.amount) || 1;
        const estimatedPrice = getEstimatedPrice(ingredient.name, ingredient.category);
        
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.amount += amount;
          existing.estimatedPrice += estimatedPrice;
        } else {
          ingredientMap.set(key, {
            name: ingredient.name,
            amount: amount,
            unit: ingredient.unit || '',
            category: ingredient.category || 'other',
            estimatedPrice: estimatedPrice
          });
        }
      });
    }

    // Clear existing grocery list items and rebuild
    await clearGroceryListItems(groceryList.id);

    // Add consolidated ingredients to grocery list
    for (const [_, ingredient] of ingredientMap) {
      const groceryItem: InsertGroceryListItem = {
        groceryListId: groceryList.id,
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        category: ingredient.category,
        estimatedPrice: ingredient.estimatedPrice,
        aisle: getCategoryAisle(ingredient.category)
      };
      
      await storage.createGroceryListItem(groceryItem);
    }

    // Update total cost
    const newTotalCost = Array.from(ingredientMap.values()).reduce((sum, ing) => sum + ing.estimatedPrice, 0);

    await storage.updateGroceryList(groceryList.id, {
      totalCost: newTotalCost.toFixed(2)
    });

    console.log("Grocery list updated successfully after recipe replacement");
  } catch (error) {
    console.error("Error updating grocery list:", error);
    // Don't throw error here - recipe replacement should still succeed even if grocery list update fails
  }
}

async function clearGroceryListItems(groceryListId: number) {
  try {
    // This is a simplified approach - in a real implementation, you'd want to add a method to storage
    // For now, we'll use a direct SQL query
    const { db } = await import('../db');
    await db.execute(`DELETE FROM grocery_list_items WHERE grocery_list_id = ${groceryListId}`);
  } catch (error) {
    console.error("Error clearing grocery list items:", error);
  }
}

function getEstimatedPrice(ingredientName: string, category: string): number {
  const basePrices: { [key: string]: number } = {
    'protein': 5.99,
    'meat': 7.99,
    'dairy': 3.49,
    'produce': 2.99,
    'vegetable': 2.99,
    'grain': 2.49,
    'spice': 1.99,
    'condiment': 3.99,
    'other': 2.99
  };
  
  return basePrices[category] || basePrices['other'];
}

function getCategoryAisle(category: string): string {
  const aisleMap: { [key: string]: string } = {
    'protein': 'Meat & Seafood',
    'meat': 'Meat & Seafood',
    'dairy': 'Dairy',
    'produce': 'Produce',
    'vegetable': 'Produce',
    'grain': 'Pantry',
    'spice': 'Spices & Seasonings',
    'condiment': 'Condiments',
    'other': 'Pantry'
  };
  
  return aisleMap[category] || 'Pantry';
}