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

    // For now, return a simple response with just the meal plan
    // We can add recipe creation later once the basic flow works
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
        id: 0,
        name: `${request.name} - Shopping List`,
        totalCost: parseFloat(mealPlan.totalCost || "0"),
        items: []
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