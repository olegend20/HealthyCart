import { storage } from '../storage';
import { generateMultiMealPlan, type MultiMealPlanRequest as OpenAIMultiMealPlanRequest } from './openai';
import { 
  InsertMealPlan, 
  InsertMealPlanGroup, 
  InsertRecipe, 
  InsertRecipeIngredient, 
  InsertMeal, 
  InsertGroceryList, 
  InsertGroceryListItem 
} from '../../shared/schema';

export interface MultiMealPlanRequest {
  userId: string;
  groupName: string;
  mealPlans: Array<{
    name: string;
    targetGroup: string;
    selectedMembers: number[];
    goals: string[];
    mealTypes: string[];
    duration: number;
    mealCount: number;
    budget?: number;
    startDate: Date;
  }>;
}

export interface MultiMealPlanResponse {
  group: {
    id: number;
    name: string;
    description: string;
  };
  mealPlans: Array<{
    id: number;
    name: string;
    targetGroup: string;
    startDate: Date;
    endDate: Date;
    duration: number;
    totalCost: number;
    status: string;
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
  }>;
  consolidatedGroceryList: {
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
      usedInPlans: string[];
    }>;
  };
  optimization: {
    sharedIngredients: Array<{
      name: string;
      totalAmount: number;
      unit: string;
      usedInPlans: string[];
      estimatedSavings: number;
    }>;
    totalSavings: number;
    wasteReduction: string;
  };
  nutritionSummary: {
    overallAverages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    planComparisons: Array<{
      planName: string;
      dailyAverages: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      };
    }>;
  };
}

export async function generateEnhancedMultiMealPlan(request: MultiMealPlanRequest): Promise<MultiMealPlanResponse> {
  try {
    console.log("Starting enhanced multi-meal plan generation for user:", request.userId);
    console.log("Creating", request.mealPlans.length, "meal plans");
    
    // Get user data
    const [householdMembers, cookingEquipment, nutritionGoals] = await Promise.all([
      storage.getHouseholdMembers(request.userId),
      storage.getCookingEquipment(request.userId),
      storage.getNutritionGoals(request.userId)
    ]);
    
    console.log("Found household members:", householdMembers.length);
    console.log("Found cooking equipment:", cookingEquipment.length);
    console.log("Found nutrition goals:", nutritionGoals.length);

    // Create meal plan group
    const groupData: InsertMealPlanGroup = {
      userId: request.userId,
      name: request.groupName,
      description: `Enhanced multi-target meal planning with ${request.mealPlans.length} optimized meal plans`
    };

    const group = await storage.createMealPlanGroup(groupData);
    console.log("Created meal plan group with ID:", group.id);

    // Prepare multi-meal plan request for OpenAI
    const openaiRequest: OpenAIMultiMealPlanRequest = {
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
      nutritionGoals: nutritionGoals
        .filter(goal => goal.isActive)
        .map(goal => ({
          name: goal.name,
          description: goal.description || undefined,
          targetValue: parseFloat(goal.targetValue?.toString() || "0"),
          currentValue: parseFloat(goal.currentValue?.toString() || "0"),
          unit: goal.unit || "",
          period: goal.period || "weekly",
          isActive: goal.isActive || false
        })),
      mealPlans: request.mealPlans.map(plan => ({
        name: plan.name,
        targetGroup: plan.targetGroup,
        selectedMembers: householdMembers
          .filter(member => plan.selectedMembers.includes(member.id))
          .map(member => ({
            name: member.name,
            age: member.age || undefined,
            dietaryRestrictions: member.dietaryRestrictions || [],
            allergies: member.allergies || [],
            preferences: member.preferences || [],
            dislikes: member.dislikes || []
          })),
        goals: plan.goals,
        mealTypes: plan.mealTypes,
        duration: plan.duration,
        mealCount: plan.mealCount,
        budget: plan.budget
      }))
    };

    console.log("Calling OpenAI for multi-meal plan generation...");
    const generatedMultiPlan = await generateMultiMealPlan(openaiRequest);
    console.log("OpenAI multi-meal plan response received");

    // Process and store the generated meal plans
    const createdMealPlans = [];

    for (const [index, planData] of generatedMultiPlan.mealPlans.entries()) {
      const planConfig = request.mealPlans[index];
      
      // Calculate end date
      const endDate = new Date(planConfig.startDate);
      endDate.setDate(endDate.getDate() + planConfig.duration - 1);

      // Create meal plan record
      const mealPlanData: InsertMealPlan = {
        userId: request.userId,
        groupId: group.id,
        name: planData.name,
        targetGroup: planData.targetGroup,
        startDate: planConfig.startDate,
        endDate: endDate,
        duration: planConfig.duration,
        budget: planConfig.budget?.toString(),
        goals: planConfig.goals,
        mealTypes: planConfig.mealTypes,
        status: "active",
        totalCost: planData.totalEstimatedCost.toString()
      };

      const mealPlan = await storage.createMealPlan(mealPlanData);
      console.log(`Created meal plan ${index + 1}/${generatedMultiPlan.mealPlans.length}: ${mealPlan.name} (ID: ${mealPlan.id})`);

      // Add selected members to the meal plan
      if (planConfig.selectedMembers.length > 0) {
        await storage.addMealPlanMembers(mealPlan.id, planConfig.selectedMembers);
      }

      // Create meals and recipes
      const createdMeals = [];
      if (planData.meals && planData.meals.length > 0) {
        for (const [mealIndex, meal] of planData.meals.entries()) {
          // Create recipe
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
          const mealDate = new Date(planConfig.startDate);
          if (planConfig.duration > 1) {
            mealDate.setDate(mealDate.getDate() + Math.floor(mealIndex * planConfig.duration / planData.meals.length));
          }

          const mealRecord: InsertMeal = {
            mealPlanId: mealPlan.id,
            recipeId: recipe.id,
            date: mealDate,
            mealType: meal.mealType || planConfig.mealTypes[0],
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

      createdMealPlans.push({
        id: mealPlan.id,
        name: mealPlan.name,
        targetGroup: mealPlan.targetGroup || "family",
        startDate: mealPlan.startDate,
        endDate: mealPlan.endDate,
        duration: mealPlan.duration,
        totalCost: parseFloat(mealPlan.totalCost || "0"),
        status: mealPlan.status || "active",
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
        }))
      });
    }

    // Create consolidated grocery lists for each meal plan
    const consolidatedGroceryLists = [];
    const consolidatedItems = generatedMultiPlan.crossPlanOptimization.consolidatedShoppingList || [];
    
    for (const mealPlan of createdMealPlans) {
      // Create grocery list for this meal plan
      const groceryListData: InsertGroceryList = {
        mealPlanId: mealPlan.id,
        name: `${mealPlan.name} - Consolidated Shopping List`,
        totalCost: consolidatedItems
          .reduce((total, item) => total + item.estimatedPrice, 0).toString()
      };

      const groceryList = await storage.createGroceryList(groceryListData);
      console.log(`Created grocery list for meal plan ${mealPlan.name} with ID: ${groceryList.id}`);

      // Create grocery list items for this meal plan
      const groceryItems = [];
      for (const item of consolidatedItems) {
        const groceryItemData: InsertGroceryListItem = {
          groceryListId: groceryList.id,
          name: item.name,
          amount: item.totalAmount,
          unit: item.unit,
          category: item.category,
          estimatedPrice: item.estimatedPrice,
          aisle: item.aisle
        };

        const groceryItem = await storage.createGroceryListItem(groceryItemData);
        groceryItems.push({
          ...groceryItem,
          amount: parseFloat(groceryItem.amount?.toString() || "0"),
          estimatedPrice: parseFloat(groceryItem.estimatedPrice?.toString() || "0"),
          usedInPlans: generatedMultiPlan.crossPlanOptimization.sharedIngredients
            .find(shared => shared.name.toLowerCase() === item.name.toLowerCase())?.usedInPlans || []
        });
      }
      
      consolidatedGroceryLists.push({
        id: groceryList.id,
        name: groceryList.name,
        totalCost: parseFloat(groceryList.totalCost || "0"),
        items: groceryItems
      });
    }

    // Use the first grocery list as the main consolidated list for the response
    const mainConsolidatedGroceryList = consolidatedGroceryLists[0] || {
      id: 0,
      name: "No grocery list",
      totalCost: 0,
      items: []
    };

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description || ""
      },
      mealPlans: createdMealPlans,
      consolidatedGroceryList: mainConsolidatedGroceryList,
      optimization: {
        sharedIngredients: generatedMultiPlan.crossPlanOptimization.sharedIngredients,
        totalSavings: generatedMultiPlan.crossPlanOptimization.totalSavings,
        wasteReduction: generatedMultiPlan.crossPlanOptimization.wasteReduction
      },
      nutritionSummary: generatedMultiPlan.nutritionSummary
    };

  } catch (error) {
    console.error("Error generating enhanced multi-meal plan:", error);
    throw new Error(`Failed to generate enhanced multi-meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}