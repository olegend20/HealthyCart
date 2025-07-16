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
    console.log("Processing", generatedPlan.meals?.length || 0, "meals from OpenAI");

    // Calculate end date
    const endDate = new Date(request.startDate);
    endDate.setDate(endDate.getDate() + request.duration - 1);

    // Create meal plan
    const totalCost = generatedPlan.totalEstimatedCost || 0;
    const mealPlanData: InsertMealPlan = {
      userId: request.userId,
      name: request.name,
      startDate: request.startDate,
      endDate: endDate,
      totalCost: totalCost.toString(),
      status: "active",
      budget: request.budget ? request.budget.toString() : undefined
    };

    const mealPlan = await storage.createMealPlan(mealPlanData);
    console.log("Created meal plan with ID:", mealPlan.id);

    // Create meals from OpenAI response
    const createdMeals = [];
    if (generatedPlan.meals && generatedPlan.meals.length > 0) {
      for (const [index, meal] of generatedPlan.meals.entries()) {
        console.log(`Creating meal ${index + 1}/${generatedPlan.meals.length}: ${meal.name}`);
        
        // Create recipe first
        const recipeData: InsertRecipe = {
          name: meal.name,
          description: meal.description || "",
          instructions: meal.instructions || "No instructions provided",
          prepTime: meal.prepTime || 30,
          cookTime: meal.cookTime || 30,
          servings: meal.servings || 4,
          difficulty: meal.difficulty || "medium",
          cuisine: meal.cuisine || "American",
          tags: meal.tags || [],
          nutritionFacts: meal.nutritionFacts || {},
          rating: "4.0"
        };

        const recipe = await storage.createRecipe(recipeData);
        console.log("Created recipe with ID:", recipe.id);

        // Create recipe ingredients
        if (meal.ingredients && meal.ingredients.length > 0) {
          for (const ingredient of meal.ingredients) {
            const ingredientData: InsertRecipeIngredient = {
              recipeId: recipe.id,
              name: ingredient.name,
              amount: ingredient.amount.toString(),
              unit: ingredient.unit,
              category: ingredient.category || "other",
              optional: false
            };
            await storage.createRecipeIngredient(ingredientData);
          }
        }

        // Create meal instance
        const mealDate = new Date(request.startDate);
        mealDate.setDate(mealDate.getDate() + index); // Distribute meals across days

        const mealRecord: InsertMeal = {
          mealPlanId: mealPlan.id,
          recipeId: recipe.id,
          date: mealDate,
          mealType: meal.mealType || "dinner",
          servings: meal.servings || 4,
          status: "planned",
          estimatedCost: meal.estimatedCost?.toString() || "0.00"
        };

        const createdMeal = await storage.createMeal(mealRecord);
        createdMeals.push({
          ...createdMeal,
          recipe: recipe
        });
      }
    }

    // Create a basic grocery list for the meal plan
    const groceryListData: InsertGroceryList = {
      mealPlanId: mealPlan.id,
      name: `${request.name} - Shopping List`,
      totalCost: totalCost.toString()
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

    // Create consolidated grocery list from all meal ingredients
    const ingredientMap = new Map<string, { amount: number; unit: string; category: string; }>();
    
    if (generatedPlan.meals && generatedPlan.meals.length > 0) {
      for (const meal of generatedPlan.meals) {
        for (const ingredient of meal.ingredients) {
          const key = ingredient.name.toLowerCase();
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.amount += ingredient.amount;
          } else {
            ingredientMap.set(key, {
              amount: ingredient.amount,
              unit: ingredient.unit,
              category: ingredient.category
            });
          }
        }
      }

      // Create grocery list items from consolidated ingredients
      for (const [name, details] of ingredientMap) {
        const itemData: InsertGroceryListItem = {
          groceryListId: groceryList.id,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          amount: details.amount.toString(),
          unit: details.unit,
          category: details.category,
          estimatedPrice: (Math.random() * 5 + 1).toString(), // Random price between $1-6
          purchased: false,
          aisle: getCategoryAisle(details.category)
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

    // If no meals were generated, add some basic grocery items for demonstration
    if (groceryItems.length === 0) {
      const defaultItems = [
        { name: "Chicken Breast", amount: "2", unit: "lbs", category: "Meat", price: "8.99" },
        { name: "Brown Rice", amount: "1", unit: "bag", category: "Grains", price: "3.49" },
        { name: "Broccoli", amount: "1", unit: "head", category: "Vegetables", price: "2.99" },
        { name: "Olive Oil", amount: "1", unit: "bottle", category: "Oils", price: "5.99" },
        { name: "Onion", amount: "1", unit: "bag", category: "Vegetables", price: "1.99" },
        { name: "Garlic", amount: "1", unit: "bulb", category: "Vegetables", price: "0.99" }
      ];

      for (const defaultItem of defaultItems) {
        const itemData: InsertGroceryListItem = {
          groceryListId: groceryList.id,
          name: defaultItem.name,
          amount: defaultItem.amount,
          unit: defaultItem.unit,
          category: defaultItem.category,
          estimatedPrice: defaultItem.price,
          purchased: false,
          aisle: getCategoryAisle(defaultItem.category)
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

    return {
      mealPlan: {
        id: mealPlan.id,
        name: mealPlan.name,
        startDate: mealPlan.startDate,
        endDate: mealPlan.endDate,
        totalCost: parseFloat(mealPlan.totalCost || "0"),
        status: mealPlan.status || "active"
      },
      meals: createdMeals.map(meal => ({
        id: meal.id,
        name: meal.recipe.name,
        date: meal.date,
        mealType: meal.mealType,
        servings: meal.servings,
        estimatedCost: parseFloat(meal.estimatedCost || "0"),
        recipe: {
          id: meal.recipe.id,
          name: meal.recipe.name,
          description: meal.recipe.description || "",
          prepTime: meal.recipe.prepTime || 30,
          cookTime: meal.recipe.cookTime || 30,
          difficulty: meal.recipe.difficulty || "medium",
          cuisine: meal.recipe.cuisine || "American",
          tags: meal.recipe.tags || [],
          nutritionFacts: meal.recipe.nutritionFacts || {},
          imageUrl: meal.recipe.imageUrl
        }
      })),
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