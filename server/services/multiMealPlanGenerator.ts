import { storage } from '../storage';
import { generateMealPlan } from './openai';
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
    sharedIngredients: string[];
    totalCostSavings: number;
    wasteReduction: string;
    ingredientOverlapPercentage: number;
  };
}

export async function generateMultiMealPlan(request: MultiMealPlanRequest): Promise<MultiMealPlanResponse> {
  console.log("Starting multi-meal plan generation for user:", request.userId);
  console.log("Number of meal plans to generate:", request.mealPlans.length);

  // Get household members and cooking equipment
  const householdMembers = await storage.getHouseholdMembers(request.userId);
  const cookingEquipment = await storage.getCookingEquipment(request.userId);

  console.log("Found household members:", householdMembers.length);
  console.log("Found cooking equipment:", cookingEquipment.length);

  // Create meal plan group
  const groupData: InsertMealPlanGroup = {
    userId: request.userId,
    name: request.groupName,
    description: `Multi-target meal planning with ${request.mealPlans.length} meal plans`
  };

  const group = await storage.createMealPlanGroup(groupData);
  console.log("Created meal plan group with ID:", group.id);

  // Generate individual meal plans
  const generatedMealPlans = [];
  const allIngredients = new Map<string, {
    totalAmount: number;
    unit: string;
    category: string;
    estimatedPrice: number;
    usedInPlans: string[];
  }>();

  for (const [index, planConfig] of request.mealPlans.entries()) {
    console.log(`Generating meal plan ${index + 1}/${request.mealPlans.length}: ${planConfig.name}`);

    // Get selected household members for this plan
    const selectedMembers = householdMembers.filter(member => 
      planConfig.selectedMembers.includes(member.id)
    );

    // Prepare OpenAI request for this specific meal plan
    const openaiRequest = {
      householdMembers: selectedMembers.map(member => ({
        name: member.name,
        age: member.age,
        dietaryRestrictions: member.dietaryRestrictions || [],
        allergies: member.allergies || [],
        preferences: member.preferences || [],
        dislikes: member.dislikes || []
      })),
      cookingEquipment: cookingEquipment.map(eq => ({
        name: eq.name,
        type: eq.type
      })),
      duration: planConfig.duration,
      budget: planConfig.budget,
      goals: planConfig.goals,
      mealTypes: planConfig.mealTypes
    };

    // Generate meal plan using OpenAI
    const generatedPlan = await generateMealPlan(openaiRequest);
    
    // Calculate end date
    const endDate = new Date(planConfig.startDate);
    endDate.setDate(endDate.getDate() + planConfig.duration - 1);

    // Create meal plan record
    const mealPlanData: InsertMealPlan = {
      userId: request.userId,
      groupId: group.id,
      name: planConfig.name,
      targetGroup: planConfig.targetGroup,
      startDate: planConfig.startDate,
      endDate: endDate,
      duration: planConfig.duration,
      budget: planConfig.budget?.toString(),
      goals: planConfig.goals,
      mealTypes: planConfig.mealTypes,
      status: "active",
      totalCost: generatedPlan.totalEstimatedCost?.toString() || "0"
    };

    const mealPlan = await storage.createMealPlan(mealPlanData);
    console.log("Created meal plan with ID:", mealPlan.id);

    // Create meals and recipes
    const createdMeals = [];
    if (generatedPlan.meals && generatedPlan.meals.length > 0) {
      for (const [mealIndex, meal] of generatedPlan.meals.entries()) {
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

        // Create recipe ingredients and track for consolidation
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

            // Track ingredient for consolidation
            const key = ingredient.name.toLowerCase();
            if (allIngredients.has(key)) {
              const existing = allIngredients.get(key)!;
              existing.totalAmount += ingredient.amount;
              existing.usedInPlans.push(planConfig.name);
            } else {
              allIngredients.set(key, {
                totalAmount: ingredient.amount,
                unit: ingredient.unit,
                category: ingredient.category || "other",
                estimatedPrice: Math.random() * 5 + 1, // Random price for now
                usedInPlans: [planConfig.name]
              });
            }
          }
        }

        // Create meal instance
        const mealDate = new Date(planConfig.startDate);
        if (planConfig.duration > 1) {
          mealDate.setDate(mealDate.getDate() + Math.floor(mealIndex * planConfig.duration / generatedPlan.meals.length));
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

    generatedMealPlans.push({
      ...mealPlan,
      meals: createdMeals
    });
  }

  // Create consolidated grocery list
  const consolidatedGroceryListData: InsertGroceryList = {
    mealPlanId: generatedMealPlans[0].id, // Associate with first meal plan
    name: `${request.groupName} - Consolidated Shopping List`,
    totalCost: Array.from(allIngredients.values()).reduce((sum, item) => sum + item.estimatedPrice, 0).toString()
  };

  const consolidatedGroceryList = await storage.createGroceryList(consolidatedGroceryListData);
  const groceryItems = [];

  // Create consolidated grocery list items
  for (const [name, details] of allIngredients) {
    const itemData: InsertGroceryListItem = {
      groceryListId: consolidatedGroceryList.id,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount: details.totalAmount.toString(),
      unit: details.unit,
      category: details.category,
      estimatedPrice: details.estimatedPrice.toString(),
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
      aisle: item.aisle || undefined,
      usedInPlans: details.usedInPlans
    });
  }

  // Calculate optimization metrics
  const sharedIngredients = Array.from(allIngredients.entries())
    .filter(([_, details]) => details.usedInPlans.length > 1)
    .map(([name, _]) => name);

  const totalCostSavings = sharedIngredients.length * 2.5; // Estimate $2.50 savings per shared ingredient
  const ingredientOverlapPercentage = (sharedIngredients.length / allIngredients.size) * 100;

  return {
    group: {
      id: group.id,
      name: group.name,
      description: group.description || ""
    },
    mealPlans: generatedMealPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      targetGroup: plan.targetGroup || "family",
      startDate: plan.startDate,
      endDate: plan.endDate,
      duration: plan.duration || 7,
      totalCost: parseFloat(plan.totalCost || "0"),
      status: plan.status || "active",
      meals: plan.meals.map(meal => ({
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
    })),
    consolidatedGroceryList: {
      id: consolidatedGroceryList.id,
      name: consolidatedGroceryList.name,
      totalCost: parseFloat(consolidatedGroceryList.totalCost || "0"),
      items: groceryItems
    },
    optimization: {
      sharedIngredients,
      totalCostSavings,
      wasteReduction: `${Math.round(ingredientOverlapPercentage)}% waste reduction through ingredient sharing`,
      ingredientOverlapPercentage
    }
  };
}

function getCategoryAisle(category: string): string {
  const aisleMap: Record<string, string> = {
    'produce': 'Produce',
    'meat': 'Meat & Seafood',
    'poultry': 'Meat & Seafood',
    'seafood': 'Meat & Seafood',
    'dairy': 'Dairy',
    'pantry': 'Pantry',
    'grains': 'Pantry',
    'spices': 'Spices & Condiments',
    'condiments': 'Spices & Condiments',
    'frozen': 'Frozen',
    'beverages': 'Beverages',
    'snacks': 'Snacks',
    'other': 'Other'
  };
  
  return aisleMap[category.toLowerCase()] || 'Other';
}