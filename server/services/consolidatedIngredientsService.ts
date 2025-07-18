import { storage } from "../storage";
import OpenAI from "openai";

// Smart consolidation for purchasable units
function consolidateAmounts(amount1: string, unit1: string, amount2: string, unit2: string): string {
  // If units are the same, try to add numeric values
  if (unit1 === unit2) {
    const num1 = parseFloat(amount1);
    const num2 = parseFloat(amount2);
    if (!isNaN(num1) && !isNaN(num2)) {
      return (num1 + num2).toString();
    }
  }
  
  // For different units or non-numeric amounts, concatenate with a separator
  if (amount1 && amount2) {
    return `${amount1} + ${amount2}`;
  }
  
  return amount1 || amount2;
}

export interface ConsolidatedIngredient {
  name: string;
  totalAmount: string;
  unit: string;
  category: string;
  usedInPlans: string[];
  aisle?: string;
}

export interface ConsolidatedIngredientsResponse {
  id: string;
  name: string;
  ingredients: ConsolidatedIngredient[];
  metadata: {
    mealPlanCount: number;
    recipeCount: number;
    totalItems: number;
  };
}

export interface StoreOrganizationRequest {
  ingredients: ConsolidatedIngredient[];
  store: string;
}

export interface InstacartFormatRequest {
  ingredients: ConsolidatedIngredient[];
}

// Get consolidated ingredients for a single meal plan
export async function getConsolidatedIngredientsForMealPlan(mealPlanId: number, userId: string): Promise<ConsolidatedIngredientsResponse> {
  try {
    // Get meal plan details
    const mealPlan = await storage.getMealPlan(mealPlanId, userId);
    if (!mealPlan) {
      throw new Error("Meal plan not found");
    }

    // Get meals for this meal plan
    const meals = await storage.getMeals(mealPlanId);
    
    // Get all recipe ingredients for consolidation
    const ingredientMap = new Map<string, ConsolidatedIngredient>();
    let recipeCount = 0;

    for (const meal of meals) {
      const ingredients = await storage.getRecipeIngredients(meal.recipeId);
      recipeCount++;

      for (const ingredient of ingredients) {
        const key = ingredient.name.toLowerCase();
        const amount = ingredient.amount || "1";

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          // For purchasable units, we need smart consolidation
          existing.totalAmount = consolidateAmounts(existing.totalAmount, existing.unit, amount, ingredient.unit || "");
          if (!existing.usedInPlans.includes(mealPlan.name)) {
            existing.usedInPlans.push(mealPlan.name);
          }
        } else {
          ingredientMap.set(key, {
            name: ingredient.name,
            totalAmount: amount,
            unit: ingredient.unit || "",
            category: ingredient.category || "other",
            usedInPlans: [mealPlan.name],
            aisle: undefined
          });
        }
      }
    }

    const ingredients = Array.from(ingredientMap.values());

    return {
      id: `meal-plan-${mealPlanId}`,
      name: `${mealPlan.name} - Consolidated Ingredients`,
      ingredients,
      metadata: {
        mealPlanCount: 1,
        recipeCount,
        totalItems: ingredients.length
      }
    };
  } catch (error) {
    console.error("Error getting consolidated ingredients for meal plan:", error);
    throw new Error(`Failed to get consolidated ingredients: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get consolidated ingredients for a meal plan group
export async function getConsolidatedIngredientsForGroup(groupId: number, userId: string): Promise<ConsolidatedIngredientsResponse> {
  try {
    // Get meal plan group details
    const group = await storage.getMealPlanGroup(groupId, userId);
    if (!group) {
      throw new Error("Meal plan group not found");
    }

    // Get all meal plans in the group
    const mealPlans = await storage.getMealPlansByGroup(groupId, userId);
    
    const ingredientMap = new Map<string, ConsolidatedIngredient>();
    let totalRecipeCount = 0;

    for (const mealPlan of mealPlans) {
      const meals = await storage.getMeals(mealPlan.id);
      
      for (const meal of meals) {
        const ingredients = await storage.getRecipeIngredients(meal.recipeId);
        totalRecipeCount++;

        for (const ingredient of ingredients) {
          const key = ingredient.name.toLowerCase();
          const amount = ingredient.amount || "1";

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            // For purchasable units, we need smart consolidation
            existing.totalAmount = consolidateAmounts(existing.totalAmount, existing.unit, amount, ingredient.unit || "");
            if (!existing.usedInPlans.includes(mealPlan.name)) {
              existing.usedInPlans.push(mealPlan.name);
            }
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              totalAmount: amount,
              unit: ingredient.unit || "",
              category: ingredient.category || "other",
              usedInPlans: [mealPlan.name],
              aisle: undefined
            });
          }
        }
      }
    }

    const ingredients = Array.from(ingredientMap.values());

    return {
      id: `group-${groupId}`,
      name: `${group.name} - Consolidated Ingredients`,
      ingredients,
      metadata: {
        mealPlanCount: mealPlans.length,
        recipeCount: totalRecipeCount,
        totalItems: ingredients.length
      }
    };
  } catch (error) {
    console.error("Error getting consolidated ingredients for group:", error);
    throw new Error(`Failed to get consolidated ingredients: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Organize ingredients by store aisles using AI
export async function organizeIngredientsByStore(request: StoreOrganizationRequest): Promise<{ [aisle: string]: ConsolidatedIngredient[] }> {
  try {
    const prompt = `
Organize these grocery items by aisle for ${request.store}:

${request.ingredients.map(item => `${item.name} (${item.totalAmount} ${item.unit})`).join('\n')}

Return a JSON object with aisles as keys and arrays of ingredient names as values.
Use typical ${request.store} store layout. Group related items logically.

Example format:
{
  "Produce": ["tomatoes", "onions", "bell peppers"],
  "Dairy": ["milk", "cheese", "yogurt"],
  "Meat & Seafood": ["chicken breast", "salmon"],
  "Pantry/Dry Goods": ["pasta", "rice", "olive oil"],
  "Frozen": ["frozen vegetables"],
  "Bakery": ["bread"]
}

Only return the JSON object, no other text.
`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error("No response from AI");
    }

    // Parse AI response - handle potential markdown formatting
    let cleanedResponse = responseText;
    if (responseText.includes('```json')) {
      cleanedResponse = responseText.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (responseText.includes('```')) {
      cleanedResponse = responseText.replace(/```\s*/, '').replace(/\s*```$/, '');
    }
    
    const aisleMapping = JSON.parse(cleanedResponse);
    
    // Create organized result with full ingredient objects
    const organizedIngredients: { [aisle: string]: ConsolidatedIngredient[] } = {};
    
    for (const [aisle, itemNames] of Object.entries(aisleMapping)) {
      organizedIngredients[aisle] = [];
      
      for (const itemName of itemNames as string[]) {
        const ingredient = request.ingredients.find(ing => 
          ing.name.toLowerCase() === itemName.toLowerCase()
        );
        
        if (ingredient) {
          organizedIngredients[aisle].push({
            ...ingredient,
            aisle
          });
        }
      }
    }

    return organizedIngredients;
  } catch (error) {
    console.error("Error organizing ingredients by store:", error);
    
    // Fallback: organize by category
    const fallbackOrganization: { [aisle: string]: ConsolidatedIngredient[] } = {};
    
    for (const ingredient of request.ingredients) {
      const aisle = getCategoryAisle(ingredient.category);
      if (!fallbackOrganization[aisle]) {
        fallbackOrganization[aisle] = [];
      }
      fallbackOrganization[aisle].push({
        ...ingredient,
        aisle
      });
    }
    
    return fallbackOrganization;
  }
}

// Generate Instacart-compatible format using AI
export async function generateInstacartFormat(request: InstacartFormatRequest): Promise<string> {
  try {
    const prompt = `
Format this grocery list for ChatGPT Instacart operator.

Ingredients:
${request.ingredients.map(item => `${item.name}: ${item.totalAmount} ${item.unit}`).join('\n')}

Return in this exact format:
"Please add these items to my Instacart cart:
- [quantity] [item name]
- [quantity] [item name]

If any items are unavailable, please suggest similar alternatives.
Prefer organic options when available."

Make sure quantities are clear and use standard grocery shopping language.
`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error("No response from AI");
    }

    return responseText;
  } catch (error) {
    console.error("Error generating Instacart format:", error);
    
    // Fallback: simple format
    const fallbackFormat = `Please add these items to my Instacart cart:
${request.ingredients.map(item => `- ${item.totalAmount} ${item.unit} ${item.name}`).join('\n')}

If any items are unavailable, please suggest similar alternatives.
Prefer organic options when available.`;
    
    return fallbackFormat;
  }
}

// Helper function to map categories to aisles (fallback)
function getCategoryAisle(category: string): string {
  const aisleMap: { [key: string]: string } = {
    'produce': 'Produce',
    'vegetables': 'Produce',
    'fruits': 'Produce',
    'meat': 'Meat & Seafood',
    'seafood': 'Meat & Seafood',
    'poultry': 'Meat & Seafood',
    'dairy': 'Dairy',
    'cheese': 'Dairy',
    'milk': 'Dairy',
    'pantry': 'Pantry/Dry Goods',
    'grains': 'Pantry/Dry Goods',
    'pasta': 'Pantry/Dry Goods',
    'rice': 'Pantry/Dry Goods',
    'spices': 'Pantry/Dry Goods',
    'condiments': 'Pantry/Dry Goods',
    'frozen': 'Frozen',
    'bakery': 'Bakery',
    'bread': 'Bakery'
  };

  return aisleMap[category.toLowerCase()] || 'Other';
}