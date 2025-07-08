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
    console.log("Starting meal plan generation for user:", request.userId);
    
    // Get user's household and equipment data
    const [householdMembers, cookingEquipment] = await Promise.all([
      storage.getHouseholdMembers(request.userId),
      storage.getCookingEquipment(request.userId)
    ]);
    
    console.log("Found household members:", householdMembers?.length || 0);
    console.log("Found cooking equipment:", cookingEquipment?.length || 0);

    // Prepare OpenAI request
    const openaiRequest: MealPlanRequest = {
      householdMembers: (householdMembers || []).map(member => ({
        name: member.name,
        age: member.age ? member.age : undefined,
        dietaryRestrictions: member.dietaryRestrictions || [],
        allergies: member.allergies || [],
        preferences: member.preferences || [],
        dislikes: member.dislikes || []
      })),
      cookingEquipment: (cookingEquipment || []).map(eq => ({
        name: eq.name,
        type: eq.type
      })),
      duration: request.duration,
      budget: request.budget,
      goals: request.goals,
      mealTypes: request.mealTypes
    };

    console.log("Calling OpenAI service...");
    const generatedPlan = await generateMealPlan(openaiRequest);
    console.log("OpenAI response received, processing...");

    // Calculate end date
    const endDate = new Date(request.startDate);
    endDate.setDate(endDate.getDate() + request.duration - 1);

    // Create meal plan
    const mealPlanData: InsertMealPlan = {
      userId: request.userId,
      name: request.name,
      startDate: request.startDate,
      endDate: endDate,
      totalCost: generatedPlan.totalEstimatedCost.toString(),
      status: "active",
      budget: request.budget ? request.budget.toString() : undefined
    };

    const mealPlan = await storage.createMealPlan(mealPlanData);
    console.log("Created meal plan with ID:", mealPlan.id);

    // Create a basic grocery list for the meal plan
    const groceryListData: InsertGroceryList = {
      mealPlanId: mealPlan.id,
      name: `${request.name} - Shopping List`,
      totalCost: generatedPlan.totalEstimatedCost.toString()
    };

    const groceryList = await storage.createGroceryList(groceryListData);
    console.log("Created grocery list with ID:", groceryList.id);

    // Create some basic grocery items from the generated plan
    const groceryItems: Array<{
      id: number;
      name: string;
      amount: number;
      unit: string;
      category: string;
      estimatedPrice: number;
      aisle?: string;
    }> = [];

    // Add some basic items from the meal plan
    if (generatedPlan.meals && generatedPlan.meals.length > 0) {
      for (const meal of generatedPlan.meals.slice(0, 3)) { // Just take first 3 meals to avoid too many items
        for (const ingredient of meal.ingredients.slice(0, 3)) { // First 3 ingredients per meal
          const itemData: InsertGroceryListItem = {
            groceryListId: groceryList.id,
            name: ingredient.name,
            amount: ingredient.amount.toString(),
            unit: ingredient.unit,
            category: ingredient.category,
            estimatedPrice: (Math.random() * 5 + 1).toFixed(2), // Random price between $1-6
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
      }
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
      meals: [], // We'll implement meal creation in the next step
      groceryList: {
        id: groceryList.id,
        name: groceryList.name,
        totalCost: parseFloat(groceryList.totalCost || "0"),
        items: groceryItems
      },
      optimization: generatedPlan.ingredientOptimization || {
        sharedIngredients: [],
        wasteReduction: "No optimization data available",
        costSavings: 0
      },
      nutritionSummary: generatedPlan.nutritionSummary || {}
    };

  } catch (error) {
    console.error("Error in meal plan generation:", error);
    throw error;
  }
}

function getCategoryAisle(category: string): string {
  const aisleMap: Record<string, string> = {
    "produce": "Produce",
    "meat": "Meat & Seafood",
    "poultry": "Meat & Seafood",
    "seafood": "Meat & Seafood",
    "dairy": "Dairy",
    "grains": "Bakery & Grains",
    "bread": "Bakery & Grains",
    "pantry": "Pantry & Canned Goods",
    "spices": "Spices & Seasonings",
    "condiments": "Condiments & Sauces",
    "frozen": "Frozen Foods",
    "beverages": "Beverages",
    "snacks": "Snacks",
    "other": "Other"
  };

  return aisleMap[category.toLowerCase()] || "Other";
}