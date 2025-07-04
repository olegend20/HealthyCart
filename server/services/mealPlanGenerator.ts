import { storage } from "../storage";
import { generateMealPlan, type MealPlanRequest } from "./openai";
import { 
  type InsertMealPlan, 
  type InsertMeal, 
  type InsertRecipe, 
  type InsertRecipeIngredient,
  type InsertGroceryList,
  type InsertGroceryListItem 
} from "@shared/schema";

export interface MealPlanGenerationRequest {
  userId: string;
  name: string;
  duration: number; // days
  budget?: number;
  goals: string[];
  mealTypes: string[]; // ['breakfast', 'lunch', 'dinner']
  startDate: Date;
}

export interface GeneratedMealPlanResponse {
  mealPlan: {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    totalCost: number;
    status: string;
  };
  meals: Array<{
    id: number;
    name: string;
    date: Date;
    mealType: string;
    servings: number;
    estimatedCost: number;
    recipe: {
      id: number;
      name: string;
      description: string;
      prepTime: number;
      cookTime: number;
      difficulty: string;
      cuisine: string;
      tags: string[];
      nutritionFacts: any;
      imageUrl?: string;
    };
  }>;
  groceryList: {
    id: number;
    name: string;
    totalCost: number;
    items: Array<{
      id: number;
      name: string;
      amount: number;
      unit: string;
      category: string;
      estimatedPrice: number;
      aisle?: string;
    }>;
  };
  optimization: {
    sharedIngredients: string[];
    wasteReduction: string;
    costSavings: number;
  };
  nutritionSummary: any;
}

export async function generateCompleteMealPlan(request: MealPlanGenerationRequest): Promise<GeneratedMealPlanResponse> {
  try {
    // Get user's household and equipment data
    const [householdMembers, cookingEquipment] = await Promise.all([
      storage.getHouseholdMembers(request.userId),
      storage.getCookingEquipment(request.userId)
    ]);

    if (householdMembers.length === 0) {
      throw new Error("No household members found. Please set up your household first.");
    }

    // Prepare OpenAI request
    const openaiRequest: MealPlanRequest = {
      householdMembers: householdMembers.map(member => ({
        name: member.name,
        age: member.age || undefined,
        dietaryRestrictions: member.dietaryRestrictions || [],
        allergies: member.allergies || [],
        preferences: member.preferences || [],
        dislikes: member.dislikes || []
      })),
      cookingEquipment: cookingEquipment.map(eq => ({
        name: eq.name,
        type: eq.type
      })),
      duration: request.duration,
      budget: request.budget,
      goals: request.goals,
      mealTypes: request.mealTypes
    };

    // Generate meal plan using OpenAI
    const generatedPlan = await generateMealPlan(openaiRequest);

    // Create meal plan record
    const endDate = new Date(request.startDate);
    endDate.setDate(endDate.getDate() + request.duration - 1);

    const mealPlanData: InsertMealPlan = {
      userId: request.userId,
      name: request.name,
      startDate: request.startDate,
      endDate: endDate,
      budget: request.budget ? request.budget.toString() : undefined,
      goals: request.goals,
      status: "active",
      totalCost: generatedPlan.totalEstimatedCost.toString()
    };

    const mealPlan = await storage.createMealPlan(mealPlanData);

    // Create recipes and meals
    const meals = [];
    for (const mealData of generatedPlan.meals) {
      // Create recipe
      const recipeData: InsertRecipe = {
        name: mealData.name,
        description: mealData.description,
        instructions: mealData.instructions,
        prepTime: mealData.prepTime,
        cookTime: mealData.cookTime,
        servings: mealData.servings,
        difficulty: mealData.difficulty,
        cuisine: mealData.cuisine,
        tags: mealData.tags,
        nutritionFacts: mealData.nutritionFacts,
        rating: "0.00" // Initial rating
      };

      const recipe = await storage.createRecipe(recipeData);

      // Create recipe ingredients
      for (const ingredient of mealData.ingredients) {
        const ingredientData: InsertRecipeIngredient = {
          recipeId: recipe.id,
          name: ingredient.name,
          amount: ingredient.amount.toString(),
          unit: ingredient.unit,
          category: ingredient.category
        };
        await storage.createRecipeIngredient(ingredientData);
      }

      // Create meal
      const mealRecord: InsertMeal = {
        mealPlanId: mealPlan.id,
        recipeId: recipe.id,
        date: new Date(mealData.date),
        mealType: mealData.mealType,
        servings: mealData.servings,
        status: "planned",
        estimatedCost: mealData.estimatedCost.toString()
      };

      const meal = await storage.createMeal(mealRecord);
      meals.push({
        id: meal.id,
        name: mealData.name,
        date: meal.date,
        mealType: meal.mealType,
        servings: meal.servings,
        estimatedCost: parseFloat(meal.estimatedCost || "0"),
        recipe: {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description || "",
          prepTime: recipe.prepTime || 0,
          cookTime: recipe.cookTime || 0,
          difficulty: recipe.difficulty || "medium",
          cuisine: recipe.cuisine || "",
          tags: recipe.tags || [],
          nutritionFacts: recipe.nutritionFacts,
          imageUrl: recipe.imageUrl || undefined
        }
      });
    }

    // Create grocery list
    const groceryListData: InsertGroceryList = {
      mealPlanId: mealPlan.id,
      name: `Grocery List for ${request.name}`,
      totalCost: generatedPlan.totalEstimatedCost.toString(),
      status: "active"
    };

    const groceryList = await storage.createGroceryList(groceryListData);

    // Consolidate ingredients and create grocery list items
    const ingredientMap = new Map<string, {
      name: string;
      amount: number;
      unit: string;
      category: string;
      estimatedPrice: number;
    }>();

    // Aggregate ingredients from all meals
    for (const mealData of generatedPlan.meals) {
      for (const ingredient of mealData.ingredients) {
        const key = `${ingredient.name}-${ingredient.unit}`;
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.amount += ingredient.amount;
          existing.estimatedPrice += ingredient.amount * 0.5; // Rough estimation
        } else {
          ingredientMap.set(key, {
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            category: ingredient.category,
            estimatedPrice: ingredient.amount * 0.5 // Rough estimation
          });
        }
      }
    }

    // Create grocery list items
    const groceryItems = [];
    for (const [, ingredient] of ingredientMap) {
      const itemData: InsertGroceryListItem = {
        groceryListId: groceryList.id,
        name: ingredient.name,
        amount: ingredient.amount.toString(),
        unit: ingredient.unit,
        category: ingredient.category,
        estimatedPrice: ingredient.estimatedPrice.toString(),
        purchased: false,
        aisle: getCategoryAisle(ingredient.category)
      };

      const item = await storage.createGroceryListItem(itemData);
      groceryItems.push({
        id: item.id,
        name: item.name,
        amount: parseFloat(item.amount || "0"),
        unit: item.unit || "",
        category: item.category || "",
        estimatedPrice: parseFloat(item.estimatedPrice || "0"),
        aisle: item.aisle || undefined
      });
    }

    return {
      mealPlan: {
        id: mealPlan.id,
        name: mealPlan.name,
        startDate: mealPlan.startDate,
        endDate: mealPlan.endDate,
        totalCost: parseFloat(mealPlan.totalCost || "0"),
        status: mealPlan.status || "active"
      },
      meals,
      groceryList: {
        id: groceryList.id,
        name: groceryList.name,
        totalCost: parseFloat(groceryList.totalCost || "0"),
        items: groceryItems
      },
      optimization: generatedPlan.ingredientOptimization,
      nutritionSummary: generatedPlan.nutritionSummary
    };

  } catch (error) {
    console.error("Error generating complete meal plan:", error);
    throw new Error(`Failed to generate meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getCategoryAisle(category: string): string {
  const aisleMap: Record<string, string> = {
    produce: "Produce",
    meat: "Meat & Seafood",
    dairy: "Dairy",
    pantry: "Pantry",
    frozen: "Frozen",
    bakery: "Bakery",
    spices: "Spices & Seasonings",
    beverages: "Beverages",
    snacks: "Snacks",
    canned: "Canned Goods",
    grains: "Grains & Rice",
    condiments: "Condiments"
  };

  return aisleMap[category.toLowerCase()] || "Other";
}
