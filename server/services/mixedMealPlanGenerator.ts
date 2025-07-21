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

export interface SelectedRecipeAssignment {
  recipeId: number;
  date: string;
  mealType: string;
  servings: number;
}

export interface MixedMealPlanRequest {
  userId: string;
  name: string;
  duration: number;
  budget?: number;
  goals: string[];
  mealTypes: string[];
  startDate: Date;
  selectedRecipes?: SelectedRecipeAssignment[];
  generateRemaining?: boolean;
}

export interface MealSlot {
  date: Date;
  mealType: string;
  isAssigned: boolean;
  assignedRecipe?: {
    id: number;
    name: string;
    servings: number;
    source: 'user-selected' | 'ai-generated';
  };
}

export async function generateMixedMealPlan(request: MixedMealPlanRequest) {
  try {
    console.log("Starting mixed meal plan generation for user:", request.userId);
    console.log("Selected recipes:", request.selectedRecipes?.length || 0);

    // 1. Create meal plan slots for the duration
    const mealSlots = createMealSlots(request.startDate, request.duration, request.mealTypes);
    
    // 2. Assign user-selected recipes to specific slots
    const assignedSlots = assignSelectedRecipes(mealSlots, request.selectedRecipes || []);
    
    // 3. Identify remaining slots that need AI generation
    const remainingSlots = assignedSlots.filter(slot => !slot.isAssigned);
    
    console.log(`Total slots: ${assignedSlots.length}, User-assigned: ${assignedSlots.length - remainingSlots.length}, Need AI: ${remainingSlots.length}`);

    // 4. Generate AI recipes for remaining slots (if requested)
    let aiGeneratedRecipes: any[] = [];
    if (request.generateRemaining && remainingSlots.length > 0) {
      aiGeneratedRecipes = await generateAIRecipesForSlots(request, remainingSlots);
    }

    // 5. Create the meal plan in the database
    const mealPlan = await createMealPlanInDatabase(request, assignedSlots, aiGeneratedRecipes);
    
    // 6. Generate grocery list from all recipes
    const groceryList = await generateGroceryListForMealPlan(mealPlan.id, request.userId);
    
    console.log("Mixed meal plan generation completed successfully");
    
    return {
      mealPlan,
      groceryList,
      summary: {
        totalMeals: assignedSlots.length,
        userSelectedMeals: assignedSlots.filter(s => s.isAssigned).length,
        aiGeneratedMeals: aiGeneratedRecipes.length,
        emptySlots: remainingSlots.length - aiGeneratedRecipes.length
      }
    };

  } catch (error: any) {
    console.error("Error in mixed meal plan generation:", error);
    throw new Error(`Failed to generate mixed meal plan: ${error?.message || 'Unknown error'}`);
  }
}

function createMealSlots(startDate: Date, duration: number, mealTypes: string[]): MealSlot[] {
  const slots: MealSlot[] = [];
  
  for (let day = 0; day < duration; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    
    for (const mealType of mealTypes) {
      slots.push({
        date,
        mealType,
        isAssigned: false
      });
    }
  }
  
  return slots;
}

function assignSelectedRecipes(slots: MealSlot[], selectedRecipes: SelectedRecipeAssignment[]): MealSlot[] {
  const updatedSlots = [...slots];
  
  for (const assignment of selectedRecipes) {
    const assignmentDate = new Date(assignment.date);
    
    // Find the matching slot
    const slotIndex = updatedSlots.findIndex(slot => 
      slot.date.toDateString() === assignmentDate.toDateString() && 
      slot.mealType === assignment.mealType
    );
    
    if (slotIndex !== -1) {
      updatedSlots[slotIndex] = {
        ...updatedSlots[slotIndex],
        isAssigned: true,
        assignedRecipe: {
          id: assignment.recipeId,
          name: '', // Will be populated when creating meals
          servings: assignment.servings,
          source: 'user-selected'
        }
      };
    }
  }
  
  return updatedSlots;
}

async function generateAIRecipesForSlots(request: MixedMealPlanRequest, remainingSlots: MealSlot[]) {
  // Get household members for dietary constraints
  const householdMembers = await storage.getHouseholdMembers(request.userId);
  
  // Build AI request for remaining meals
  const mealTypeArray = Array.from(new Set(remainingSlots.map(slot => slot.mealType)));
  const aiRequest: MealPlanRequest = {
    duration: remainingSlots.length, // Number of meals, not days
    goals: request.goals,
    mealTypes: mealTypeArray,
    budget: request.budget,
    householdMembers: householdMembers.map((member: any) => ({
      name: member.name,
      age: member.age || 30,
      dietaryRestrictions: member.dietaryRestrictions || [],
      allergies: member.allergies || [],
      preferences: member.preferences || [],
      dislikes: member.dislikes || []
    })),
    cookingEquipment: await storage.getCookingEquipment(request.userId)
  };

  console.log("Generating AI recipes for remaining slots:", remainingSlots.length);
  
  const aiResponse = await generateMealPlan(aiRequest);
  return aiResponse.meals || [];
}

async function createMealPlanInDatabase(
  request: MixedMealPlanRequest, 
  slots: MealSlot[], 
  aiRecipes: any[]
) {
  // Create the meal plan
  const endDate = new Date(request.startDate);
  endDate.setDate(endDate.getDate() + request.duration - 1);

  const mealPlanData: InsertMealPlan = {
    userId: request.userId,
    name: request.name,
    startDate: request.startDate,
    endDate: endDate,
    duration: request.duration,
    budget: request.budget ? request.budget.toString() : undefined,
    goals: request.goals,
    mealTypes: request.mealTypes,
    status: "active",
    totalCost: "0" // Will be calculated later
  };

  const mealPlan = await storage.createMealPlan(mealPlanData);
  console.log("Created meal plan:", mealPlan.id);

  // Create meals for user-selected recipes
  const userSelectedSlots = slots.filter(slot => slot.isAssigned);
  for (const slot of userSelectedSlots) {
    if (slot.assignedRecipe) {
      // Get the full recipe details
      const recipe = await storage.getRecipeById(slot.assignedRecipe.id);
      if (recipe) {
        const mealData: InsertMeal = {
          mealPlanId: mealPlan.id,
          recipeId: recipe.id,
          date: slot.date,
          mealType: slot.mealType,
          servings: slot.assignedRecipe.servings,
          estimatedCost: "0", // Will be calculated
          status: "planned"
        };
        
        await storage.createMeal(mealData);
        console.log(`Created user-selected meal: ${recipe.name} for ${slot.date.toDateString()}`);
      }
    }
  }

  // Create AI-generated recipes and meals
  let aiRecipeIndex = 0;
  const unassignedSlots = slots.filter(slot => !slot.isAssigned);
  
  for (const aiMeal of aiRecipes) {
    if (aiRecipeIndex >= unassignedSlots.length) break;
    
    const slot = unassignedSlots[aiRecipeIndex];
    
    // Create the AI-generated recipe
    const recipeData: InsertRecipe = {
      name: aiMeal.name,
      description: aiMeal.description || '',
      instructions: Array.isArray(aiMeal.instructions) ? aiMeal.instructions.join('\n') : aiMeal.instructions,
      prepTime: aiMeal.prepTime,
      cookTime: aiMeal.cookTime,
      servings: aiMeal.servings,
      difficulty: aiMeal.difficulty || 'medium',
      cuisine: aiMeal.cuisine || 'international',
      tags: aiMeal.tags || [],
      nutritionFacts: aiMeal.nutritionFacts || {}
    };

    const recipe = await storage.createRecipe(recipeData);
    console.log("Created AI recipe:", recipe.name);

    // Create ingredients for the recipe
    if (aiMeal.ingredients) {
      for (const ingredient of aiMeal.ingredients) {
        const ingredientData: InsertRecipeIngredient = {
          recipeId: recipe.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit || '',
          category: ingredient.category || 'misc'
        };
        
        await storage.createRecipeIngredient(ingredientData);
      }
    }

    // Create the meal
    const mealData: InsertMeal = {
      mealPlanId: mealPlan.id,
      recipeId: recipe.id,
      date: slot.date,
      mealType: slot.mealType,
      servings: aiMeal.servings,
      estimatedCost: aiMeal.estimatedCost?.toString() || "0",
      status: "planned"
    };
    
    await storage.createMeal(mealData);
    console.log(`Created AI meal: ${recipe.name} for ${slot.date.toDateString()}`);
    
    aiRecipeIndex++;
  }

  return mealPlan;
}

async function generateGroceryListForMealPlan(mealPlanId: number, userId: string) {
  // Get all meals for this meal plan
  const meals = await storage.getMealsByMealPlanId(mealPlanId);
  
  // Get all ingredients from all recipes
  const allIngredients: Array<{
    name: string;
    amount: string;
    unit: string;
    category: string;
    recipeId: number;
    servings: number;
    recipeName: string;
  }> = [];
  
  for (const meal of meals) {
    const recipe = await storage.getRecipeById(meal.recipeId);
    if (recipe) {
      const ingredients = await storage.getRecipeIngredientsByRecipeId(recipe.id);
      
      for (const ingredient of ingredients) {
        allIngredients.push({
          name: ingredient.name,
          amount: ingredient.amount || '1',
          unit: ingredient.unit || '',
          category: ingredient.category || 'misc',
          recipeId: recipe.id,
          servings: meal.servings,
          recipeName: recipe.name
        });
      }
    }
  }

  // Create grocery list
  const groceryListData: InsertGroceryList = {
    mealPlanId: mealPlanId,
    name: `Grocery List for Meal Plan ${mealPlanId}`,
    totalCost: "0", // Will be calculated
    status: "active"
  };

  const groceryList = await storage.createGroceryList(groceryListData);

  // Consolidate ingredients by name and create grocery list items
  const consolidatedIngredients = new Map<string, {
    totalAmount: string;
    unit: string;
    category: string;
    recipes: string[];
  }>();

  for (const ingredient of allIngredients) {
    const key = ingredient.name.toLowerCase();
    
    if (consolidatedIngredients.has(key)) {
      const existing = consolidatedIngredients.get(key)!;
      existing.recipes.push(ingredient.recipeName);
      // For now, just combine amounts as strings - could be enhanced with unit conversion
      existing.totalAmount = `${existing.totalAmount} + ${ingredient.amount}`;
    } else {
      consolidatedIngredients.set(key, {
        totalAmount: ingredient.amount,
        unit: ingredient.unit,
        category: ingredient.category,
        recipes: [ingredient.recipeName]
      });
    }
  }

  // Create grocery list items
  for (const [name, details] of Array.from(consolidatedIngredients)) {
    const itemData: InsertGroceryListItem = {
      groceryListId: groceryList.id,
      name: name,
      amount: details.totalAmount,
      unit: details.unit,
      category: details.category,
      estimatedPrice: "0", // Could be enhanced with price estimation
      purchased: false,
      notes: `Used in: ${details.recipes.join(', ')}`
    };
    
    await storage.createGroceryListItem(itemData);
  }

  console.log(`Created grocery list with ${consolidatedIngredients.size} items`);
  
  return groceryList;
}