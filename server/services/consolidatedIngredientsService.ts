import { storage } from "../storage";
import OpenAI from "openai";

// Simple in-memory cache for store layouts
interface StoreLayoutCache {
  [storeKey: string]: {
    layout: { [aisle: string]: string[] };
    timestamp: number;
    ttl: number; // time to live in milliseconds
  };
}

const storeLayoutCache: StoreLayoutCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Smart consolidation for purchasable units
function consolidateAmounts(amount1: string, unit1: string, amount2: string, unit2: string): string {
  // Extract numeric values from amount strings, handling already concatenated amounts
  const extractNumber = (amount: string): number => {
    // If amount already contains "+", it's a concatenated string - extract and sum all numbers
    if (amount.includes('+')) {
      const parts = amount.split('+');
      let total = 0;
      for (const part of parts) {
        const trimmed = part.trim();
        const match = trimmed.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          total += parseFloat(match[1]);
        }
      }
      return total;
    }
    
    // Normal numeric extraction - handle decimal numbers
    const match = amount.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 1;
  };
  
  // Normalize units for comparison - handle common variations
  const normalizeUnit = (unit: string): string => {
    if (!unit) return '';
    const normalized = unit.toLowerCase().trim();
    
    // Handle unit variations
    const unitMap: { [key: string]: string } = {
      'lb': 'pound',
      'lbs': 'pound',
      'pound': 'pound',
      'pounds': 'pound',
      'oz': 'ounce',
      'ounces': 'ounce',
      'ounce': 'ounce',
      'cup': 'cup',
      'cups': 'cup',
      'tbsp': 'tablespoon',
      'tablespoons': 'tablespoon',
      'tablespoon': 'tablespoon',
      'tsp': 'teaspoon',
      'teaspoons': 'teaspoon',
      'teaspoon': 'teaspoon',
      'clove': 'clove',
      'cloves': 'clove',
      'piece': 'piece',
      'pieces': 'piece',
      'can': 'can',
      'cans': 'can',
      'bottle': 'bottle',
      'bottles': 'bottle',
      'gallon': 'gallon',
      'gallons': 'gallon',
      'bag': 'bag',
      'bags': 'bag',
      'loaf': 'loaf',
      'loaves': 'loaf',
      'dozen': 'dozen',
      'head': 'head',
      'heads': 'head',
      'stalk': 'stalk',
      'stalks': 'stalk',
      'medium': 'medium',
      'large': 'large',
      'small': 'small'
    };
    
    return unitMap[normalized] || normalized;
  };
  
  // If units are the same or similar, try to add numeric values
  if (normalizeUnit(unit1) === normalizeUnit(unit2)) {
    const num1 = extractNumber(amount1);
    const num2 = extractNumber(amount2);
    const total = num1 + num2;
    
    // Return the consolidated amount with proper formatting
    if (total === Math.floor(total)) {
      return total.toString();
    } else {
      return total.toFixed(1);
    }
  }
  
  // For different units, keep them separate but clearly indicate
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
          const newAmount = consolidateAmounts(existing.totalAmount, existing.unit, amount, ingredient.unit || "");
          existing.totalAmount = newAmount;
          // Update unit to the most recent one if they're the same (case insensitive)
          if (ingredient.unit && (existing.unit && existing.unit.toLowerCase() === ingredient.unit.toLowerCase() || !existing.unit)) {
            existing.unit = ingredient.unit;
          }
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
            const newAmount = consolidateAmounts(existing.totalAmount, existing.unit, amount, ingredient.unit || "");
            existing.totalAmount = newAmount;
            // Update unit to the most recent one if they're the same (case insensitive)
            if (ingredient.unit && (existing.unit && existing.unit.toLowerCase() === ingredient.unit.toLowerCase() || !existing.unit)) {
              existing.unit = ingredient.unit;
            }
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

// Helper function to check and retrieve cached store layout
function getCachedStoreLayout(store: string, ingredientNames: string[]): { [aisle: string]: string[] } | null {
  const cacheKey = `${store.toLowerCase()}-${ingredientNames.sort().join(',')}`;
  const cached = storeLayoutCache[cacheKey];
  
  if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
    return cached.layout;
  }
  
  // Clean up expired entries
  if (cached && (Date.now() - cached.timestamp) >= cached.ttl) {
    delete storeLayoutCache[cacheKey];
  }
  
  return null;
}

// Helper function to cache store layout
function cacheStoreLayout(store: string, ingredientNames: string[], layout: { [aisle: string]: string[] }): void {
  const cacheKey = `${store.toLowerCase()}-${ingredientNames.sort().join(',')}`;
  storeLayoutCache[cacheKey] = {
    layout,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  };
}

// Organize ingredients by store aisles using AI with caching
export async function organizeIngredientsByStore(request: StoreOrganizationRequest): Promise<{ [aisle: string]: ConsolidatedIngredient[] }> {
  try {
    const ingredientNames = request.ingredients.map(ing => ing.name);
    
    // Check cache first
    const cachedLayout = getCachedStoreLayout(request.store, ingredientNames);
    let aisleMapping: { [aisle: string]: string[] };
    
    if (cachedLayout) {
      console.log(`Using cached store layout for ${request.store}`);
      aisleMapping = cachedLayout;
    } else {
      // Generate new layout via AI
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
      
      aisleMapping = JSON.parse(cleanedResponse);
      
      // Cache the result
      cacheStoreLayout(request.store, ingredientNames, aisleMapping);
    }
    
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
You are an expert grocery shopping assistant. Convert this cooking ingredient list into grocery store purchasing format for Instacart.

COOKING INGREDIENTS TO CONVERT:
${request.ingredients.map(item => `${item.name}: ${item.totalAmount} ${item.unit}`).join('\n')}

CONVERSION RULES:
1. Convert cooking measurements to grocery store units:
   - "cups flour" → "5 lb bag all-purpose flour"
   - "tablespoons olive oil" → "1 bottle olive oil (16.9 fl oz)"
   - "ounces cheese" → "8 oz package shredded cheese"
   - "cups milk" → "1 gallon milk" or "1 half-gallon milk"
   - "pounds meat" → keep as "X lbs [cut] [meat type]"
   - "whole items" → keep as count (e.g., "3 onions", "2 bell peppers")

2. Use standard grocery package sizes:
   - Flour: 5 lb bags
   - Sugar: 4 lb bags  
   - Rice: 2 lb or 5 lb bags
   - Pasta: 1 lb boxes
   - Canned goods: standard can sizes
   - Dairy: gallon, half-gallon, quart containers
   - Produce: by piece or pound as typically sold

3. Round up to ensure enough quantity
4. Use grocery store language (not cooking measurements)
5. Specify common brands or types when helpful

Return in this exact format:
"Please add these items to my Instacart cart:
- [grocery quantity/package] [specific item name]
- [grocery quantity/package] [specific item name]

If any items are unavailable, please suggest similar alternatives.
Prefer organic options when available."

Make each item specific and purchasable from a grocery store.
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
    
    // Fallback: convert units and create grocery-friendly format
    const convertedIngredients = request.ingredients.map(item => 
      convertToGroceryFormat(item.name, item.totalAmount, item.unit)
    );
    
    const fallbackFormat = `Please add these items to my Instacart cart:
${convertedIngredients.map(item => `- ${item}`).join('\n')}

If any items are unavailable, please suggest similar alternatives.
Prefer organic options when available.`;
    
    return fallbackFormat;
  }
}

// Helper function to convert cooking measurements to grocery shopping format
function convertToGroceryFormat(name: string, amount: string | number, unit: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) || 1 : amount;
  const lowerName = name.toLowerCase();
  const lowerUnit = unit.toLowerCase();

  // Handle specific ingredient conversions
  if (lowerName.includes('flour')) {
    if (lowerUnit.includes('cup')) {
      const cups = numAmount;
      // 1 cup flour ≈ 4.5 oz, 5 lb bag = 80 oz
      if (cups <= 8) return '5 lb bag all-purpose flour';
      return '10 lb bag all-purpose flour';
    }
    if (lowerUnit.includes('lb') || lowerUnit.includes('pound')) {
      if (numAmount <= 5) return '5 lb bag all-purpose flour';
      return '10 lb bag all-purpose flour';
    }
  }

  if (lowerName.includes('sugar')) {
    if (lowerUnit.includes('cup')) {
      return '4 lb bag granulated sugar';
    }
    if (lowerUnit.includes('lb') || lowerUnit.includes('pound')) {
      if (numAmount <= 4) return '4 lb bag granulated sugar';
      return '10 lb bag granulated sugar';
    }
  }

  if (lowerName.includes('milk')) {
    if (lowerUnit.includes('cup')) {
      const cups = numAmount;
      if (cups <= 4) return '1 quart milk';
      if (cups <= 8) return '1 half-gallon milk';
      return '1 gallon milk';
    }
  }

  if (lowerName.includes('oil') && (lowerUnit.includes('tbsp') || lowerUnit.includes('tablespoon'))) {
    return '1 bottle olive oil (16.9 fl oz)';
  }

  if (lowerName.includes('cheese')) {
    if (lowerUnit.includes('cup') || lowerUnit.includes('oz') || lowerUnit.includes('ounce')) {
      const oz = lowerUnit.includes('cup') ? numAmount * 4 : numAmount; // roughly 1 cup = 4 oz for shredded cheese
      if (oz <= 8) return '8 oz package shredded cheese';
      return '16 oz package shredded cheese';
    }
  }

  if (lowerName.includes('pasta') || lowerName.includes('noodle')) {
    if (lowerUnit.includes('lb') || lowerUnit.includes('pound') || lowerUnit.includes('oz')) {
      return '1 lb box pasta';
    }
  }

  if (lowerName.includes('rice')) {
    if (lowerUnit.includes('cup')) {
      const cups = numAmount;
      if (cups <= 4) return '2 lb bag rice';
      return '5 lb bag rice';
    }
  }

  // Handle produce (keep as pieces or convert to pounds)
  if (lowerName.includes('onion') || lowerName.includes('bell pepper') || lowerName.includes('tomato')) {
    if (lowerUnit.includes('whole') || lowerUnit === '' || lowerUnit === 'each') {
      const count = Math.ceil(numAmount);
      return `${count} ${count === 1 ? lowerName : lowerName + 's'}`;
    }
  }

  // Handle meat/protein - keep as pounds
  if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork') || 
      lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('turkey')) {
    if (lowerUnit.includes('lb') || lowerUnit.includes('pound')) {
      return `${Math.ceil(numAmount)} lbs ${name}`;
    }
    if (lowerUnit.includes('oz') || lowerUnit.includes('ounce')) {
      const pounds = Math.ceil(numAmount / 16 * 10) / 10; // round up to nearest 0.1 lb
      return `${pounds} lbs ${name}`;
    }
  }

  // Handle canned goods
  if (lowerName.includes('tomato') && (lowerName.includes('can') || lowerName.includes('diced') || lowerName.includes('crushed'))) {
    const cans = Math.ceil(numAmount);
    return `${cans} can${cans > 1 ? 's' : ''} diced tomatoes (14.5 oz)`;
  }

  // Default: try to keep reasonable format
  if (lowerUnit.includes('cup') || lowerUnit.includes('tbsp') || lowerUnit.includes('tsp')) {
    // For small amounts in cooking units, suggest package sizes
    return `1 package ${name}`;
  }

  // If amount and unit are already grocery-friendly, keep them
  if (lowerUnit.includes('lb') || lowerUnit.includes('oz') || lowerUnit === '' || lowerUnit === 'each') {
    const cleanAmount = Math.ceil(numAmount);
    return `${cleanAmount} ${unit} ${name}`.trim();
  }

  // Fallback
  return `${Math.ceil(numAmount)} ${unit} ${name}`.trim();
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