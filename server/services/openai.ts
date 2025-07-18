import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
});

export interface MealPlanRequest {
  householdMembers: Array<{
    name: string;
    age?: number;
    dietaryRestrictions: string[];
    allergies: string[];
    preferences: string[];
    dislikes: string[];
  }>;
  cookingEquipment: Array<{
    name: string;
    type: string;
  }>;
  duration: number; // days
  budget?: number;
  goals: string[];
  mealTypes: string[]; // ['breakfast', 'lunch', 'dinner']
}

export interface MultiMealPlanRequest {
  householdMembers: Array<{
    name: string;
    age?: number;
    dietaryRestrictions: string[];
    allergies: string[];
    preferences: string[];
    dislikes: string[];
  }>;
  cookingEquipment: Array<{
    name: string;
    type: string;
  }>;
  nutritionGoals: Array<{
    name: string;
    description?: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    period: string;
    isActive: boolean;
  }>;
  mealPlans: Array<{
    name: string;
    targetGroup: string;
    selectedMembers: Array<{
      name: string;
      age?: number;
      dietaryRestrictions: string[];
      allergies: string[];
      preferences: string[];
      dislikes: string[];
    }>;
    goals: string[];
    mealTypes: string[];
    duration: number;
    mealCount: number;
    budget?: number;
  }>;
}

export interface GeneratedMealPlan {
  meals: Array<{
    name: string;
    description: string;
    date: string;
    mealType: string;
    servings: number;
    prepTime: number;
    cookTime: number;
    difficulty: string;
    cuisine: string;
    ingredients: Array<{
      name: string;
      amount: number;
      unit: string;
      category: string;
    }>;
    instructions: string;
    estimatedCost: number;
    tags: string[];
    nutritionFacts: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    equipmentUsed: string[];
  }>;
  totalEstimatedCost: number;
  ingredientOptimization: {
    sharedIngredients: string[];
    wasteReduction: string;
    costSavings: number;
  };
  nutritionSummary: {
    dailyAverages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    goalProgress: Array<{
      goal: string;
      progress: number;
      recommendations: string[];
    }>;
  };
}

export interface GeneratedMultiMealPlan {
  mealPlans: Array<{
    name: string;
    targetGroup: string;
    meals: Array<{
      name: string;
      description: string;
      date: string;
      mealType: string;
      servings: number;
      prepTime: number;
      cookTime: number;
      difficulty: string;
      cuisine: string;
      ingredients: Array<{
        name: string;
        amount: number;
        unit: string;
        category: string;
      }>;
      instructions: string;
      estimatedCost: number;
      tags: string[];
      nutritionFacts: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      };
      equipmentUsed: string[];
    }>;
    totalEstimatedCost: number;
  }>;
  crossPlanOptimization: {
    sharedIngredients: Array<{
      name: string;
      totalAmount: number;
      unit: string;
      usedInPlans: string[];
      estimatedSavings: number;
    }>;
    consolidatedShoppingList: Array<{
      name: string;
      totalAmount: number;
      unit: string;
      category: string;
      estimatedPrice: number;
      aisle?: string;
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

export async function generateMealPlan(request: MealPlanRequest): Promise<GeneratedMealPlan> {
  const systemPrompt = `You are a professional meal planning assistant that specializes in creating optimized weekly meal plans. Your expertise includes:

1. Ingredient optimization to minimize waste and maximize cost efficiency
2. Nutritional balance across all household members
3. Accommodation of dietary restrictions and preferences
4. Strategic use of available cooking equipment
5. Hidden vegetable techniques for children
6. Budget-conscious meal planning

Create meal plans that prioritize ingredient overlap between meals to reduce costs and waste while ensuring nutritional variety and family satisfaction.`;

  const userPrompt = `Please create a ${request.duration}-day meal plan for a household with the following requirements:

HOUSEHOLD MEMBERS:
${request.householdMembers.map(member => `
- ${member.name} (${member.age ? `${member.age} years old` : 'age not specified'})
  - Dietary restrictions: ${member.dietaryRestrictions.join(', ') || 'None'}
  - Allergies: ${member.allergies.join(', ') || 'None'}
  - Preferences: ${member.preferences.join(', ') || 'None specified'}
  - Dislikes: ${member.dislikes.join(', ') || 'None specified'}
`).join('')}

AVAILABLE COOKING EQUIPMENT:
${request.cookingEquipment.map(eq => `- ${eq.name} (${eq.type})`).join('\n')}

GOALS:
${request.goals.join('\n')}

MEAL TYPES TO INCLUDE: ${request.mealTypes.join(', ')}
${request.budget ? `BUDGET TARGET: $${request.budget}` : ''}

IMPORTANT REQUIREMENTS:
1. Maximize ingredient overlap between meals to reduce costs
2. Ensure meals are safe for all household members (respect allergies)
3. Use available cooking equipment strategically
4. Include hidden vegetables for children when applicable
5. Provide detailed nutritional information
6. Include specific cooking instructions
7. Suggest ingredient substitutions for allergies/preferences
8. **CRITICAL: Use PURCHASABLE UNITS for all ingredients** - specify amounts as they would be bought at the store (lbs, oz, cans, bottles, packages) NOT cooking measurements (cups, tablespoons, etc.). Examples:
   - "1 lb ground beef" not "1 cup ground beef"
   - "1 can (14.5 oz) diced tomatoes" not "1 cup tomatoes"
   - "1 gallon milk" not "1 cup milk"
   - "1 bag (2 lbs) mixed vegetables" not "1 cup mixed vegetables"
   - "1 bottle (16 oz) olive oil" not "2 tablespoons olive oil"
   - "1 loaf bread" not "4 slices bread"
   - "1 dozen eggs" not "2 eggs"

Please respond with a complete meal plan in JSON format with this exact structure:
{
  "meals": [
    {
      "name": "Recipe Name",
      "description": "Brief description", 
      "date": "2025-01-01",
      "mealType": "dinner",
      "servings": 4,
      "prepTime": 30,
      "cookTime": 25,
      "difficulty": "medium",
      "cuisine": "American",
      "ingredients": [
        {
          "name": "chicken breast",
          "amount": 1.5,
          "unit": "lbs",
          "category": "protein"
        },
        {
          "name": "diced tomatoes",
          "amount": 1,
          "unit": "can (14.5 oz)",
          "category": "vegetables"
        },
        {
          "name": "olive oil",
          "amount": 16,
          "unit": "oz bottle",
          "category": "condiments"
        }
      ],
      "instructions": "Step by step cooking instructions",
      "estimatedCost": 12.50,
      "tags": ["healthy", "high-protein"],
      "nutritionFacts": {
        "calories": 350,
        "protein": 35,
        "carbs": 20,
        "fat": 10,
        "fiber": 5
      },
      "equipmentUsed": ["stove", "oven"]
    }
  ],
  "totalEstimatedCost": 85.00,
  "ingredientOptimization": {
    "sharedIngredients": ["onions", "garlic"],
    "wasteReduction": "Used chicken in 3 meals",
    "costSavings": 15.00
  },
  "nutritionSummary": {
    "dailyAverages": {
      "calories": 450,
      "protein": 35,
      "carbs": 45,
      "fat": 15,
      "fiber": 8
    },
    "goalProgress": [
      {
        "goal": "Higher protein",
        "progress": 85,
        "recommendations": ["Add protein snacks"]
      }
    ]
  }
}`;

  try {
    console.log("Sending request to OpenAI with model gpt-4o");
    console.log("Request goals:", request.goals);
    console.log("Request meal types:", request.mealTypes);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    console.log("OpenAI response received");
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    console.log("Parsing OpenAI response");
    console.log("Raw OpenAI response:", content.substring(0, 500) + "...");
    const generatedPlan: GeneratedMealPlan = JSON.parse(content);
    
    // Handle different response formats from OpenAI
    let meals = generatedPlan.meals || [];
    if (!meals.length && (generatedPlan as any).mealPlan) {
      // OpenAI sometimes returns { "mealPlan": [...] } instead of { "meals": [...] }
      meals = (generatedPlan as any).mealPlan;
      console.log("Found meals in mealPlan property, converting format");
    }
    
    console.log("Generated meal plan with", meals?.length || 0, "meals");
    console.log("Meal plan structure:", Object.keys(generatedPlan));
    if (meals && meals.length > 0) {
      console.log("First meal example:", meals[0]);
    }
    
    // Normalize the response format
    const normalizedPlan: GeneratedMealPlan = {
      meals: meals || [],
      totalEstimatedCost: generatedPlan.totalEstimatedCost || 0,
      ingredientOptimization: generatedPlan.ingredientOptimization || {
        sharedIngredients: [],
        wasteReduction: "No optimization data available",
        costSavings: 0
      },
      nutritionSummary: generatedPlan.nutritionSummary || {
        dailyAverages: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        },
        goalProgress: []
      }
    };
    
    return normalizedPlan;
  } catch (error) {
    console.error("Error generating meal plan:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Failed to generate meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateMultiMealPlan(request: MultiMealPlanRequest): Promise<GeneratedMultiMealPlan> {
  const systemPrompt = `You are an expert meal planning assistant specializing in creating multiple coordinated meal plans that maximize ingredient overlap and cost efficiency. Your expertise includes:

1. Cross-plan ingredient optimization to minimize waste and costs
2. Nutritional balance across different target groups (adults, kids, dietary restrictions)
3. Strategic ingredient purchasing to maximize savings
4. Age-appropriate meal planning for different family groups
5. Budget-conscious meal planning across multiple plans

Create coordinated meal plans that prioritize ingredient overlap between all plans while respecting individual dietary needs and preferences.

INSTRUCTION REQUIREMENTS:
- Provide detailed, step-by-step cooking instructions for each recipe (minimum 5-8 steps)
- Include specific cooking techniques, temperatures, and timing for each step
- Explain preparation methods clearly for home cooks with varying skill levels
- Include tips for optimal results, doneness indicators, and presentation
- Format instructions as numbered steps with clear, actionable directions
- Include resting times, seasoning moments, and finishing touches
- Mention visual cues (golden brown, bubbling, etc.) and internal temperatures where applicable`;

  console.log("OpenAI Request - Meal Plans:", request.mealPlans.map(p => `${p.name}: ${p.mealCount} meals`));
  console.log("Selected Members by Plan:", request.mealPlans.map(p => `${p.name}: [${p.selectedMembers.map(m => m.name).join(', ')}]`));
  console.log("User Nutrition Goals:", request.nutritionGoals.length > 0 ? 
    request.nutritionGoals.map(g => `${g.name}: ${g.currentValue}/${g.targetValue} ${g.unit}`).join(', ') : 
    'No nutrition goals set');
  
  const userPrompt = `Please create ${request.mealPlans.length} coordinated meal plans with maximum ingredient overlap for cost savings:

ALL HOUSEHOLD MEMBERS (for reference):
${request.householdMembers.map(member => `
- ${member.name} (${member.age ? `${member.age} years old` : 'age not specified'})
  - Dietary restrictions: ${member.dietaryRestrictions.join(', ') || 'None'}
  - Allergies: ${member.allergies.join(', ') || 'None'}
  - Preferences: ${member.preferences.join(', ') || 'None specified'}
  - Dislikes: ${member.dislikes.join(', ') || 'None specified'}
`).join('')}

AVAILABLE COOKING EQUIPMENT:
${request.cookingEquipment.map(eq => `- ${eq.name} (${eq.type})`).join('\n')}

USER NUTRITION GOALS:
${request.nutritionGoals.length > 0 ? request.nutritionGoals.map(goal => `
- ${goal.name}: ${goal.targetValue} ${goal.unit} (${goal.period})
  Current: ${goal.currentValue} ${goal.unit}
  ${goal.description ? `Description: ${goal.description}` : ''}
  Progress: ${goal.currentValue > 0 ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0}%
`).join('') : 'No specific nutrition goals set'}

MEAL PLANS TO CREATE:
${request.mealPlans.map((plan, index) => `
Plan ${index + 1}: ${plan.name}
- Target Group: ${plan.targetGroup}
- Duration: ${plan.duration} days
- Number of Meals: ${plan.mealCount} meals (CRITICAL: You MUST generate exactly ${plan.mealCount} meals for this plan - count them carefully)
- Meal Types: ${plan.mealTypes.join(', ')}
- Goals: ${plan.goals.join(', ')}
- Budget: ${plan.budget ? `$${plan.budget}` : 'Not specified'}
- Selected Members for this plan: ${plan.selectedMembers.length > 0 ? plan.selectedMembers.map(m => m.name).join(', ') : 'None selected'}
  ${plan.selectedMembers.map(member => `
  - ${member.name} (${member.age ? `${member.age} years old` : 'age not specified'}): 
    * Allergies: ${member.allergies.join(', ') || 'None'}
    * Preferences: ${member.preferences.join(', ') || 'None'}
    * Dislikes: ${member.dislikes.join(', ') || 'None'}`).join('')}
`).join('')}

CRITICAL REQUIREMENTS:
1. **EXACT MEAL COUNT**: Each meal plan MUST contain exactly the specified number of meals - no more, no less. COUNT CAREFULLY!
   ${request.mealPlans.map((plan, index) => `   - Plan ${index + 1} (${plan.name}): Generate exactly ${plan.mealCount} meals`).join('\n')}
2. **NUTRITION GOALS**: Design meals to help achieve the user's nutrition goals listed above
3. **DETAILED INSTRUCTIONS**: Each recipe must include comprehensive, step-by-step cooking instructions with specific techniques, temperatures, and timing
4. **MAXIMIZE INGREDIENT OVERLAP**: Use the same ingredients across multiple meal plans where possible
5. **COST OPTIMIZATION**: Prioritize ingredients that can be bought in bulk and used across plans
6. **SAFETY FIRST**: Ensure all meals are safe for their target groups (respect allergies)
7. **AGE-APPROPRIATE**: Consider target group preferences (kids vs adults)
8. **SHARED STAPLES**: Use common ingredients like onions, garlic, rice, pasta across plans
9. **BULK BUYING**: Suggest ingredients that benefit from larger quantities
10. **WASTE REDUCTION**: Ensure perishables are used efficiently across all plans

Please respond with a complete multi-meal plan in JSON format with this exact structure:
{
  "mealPlans": [
    {
      "name": "Adult Meal Plan",
      "targetGroup": "adults",
      "meals": [
        {
          "name": "Recipe Name",
          "description": "Brief description",
          "date": "2025-01-01",
          "mealType": "dinner",
          "servings": 4,
          "prepTime": 30,
          "cookTime": 25,
          "difficulty": "medium",
          "cuisine": "American",
          "ingredients": [
            {
              "name": "chicken breast",
              "amount": 1.5,
              "unit": "lbs",
              "category": "protein"
            }
          ],
          "instructions": "1. Preheat oven to 400°F (200°C). 2. Season chicken breast with salt and pepper on both sides. 3. Heat olive oil in oven-safe skillet over medium-high heat. 4. Sear chicken breast for 3-4 minutes per side until golden brown. 5. Transfer skillet to preheated oven and cook for 15-20 minutes until internal temperature reaches 165°F (74°C). 6. Let rest for 5 minutes before slicing. 7. Serve immediately with your favorite sides.",
          "estimatedCost": 12.50,
          "tags": ["healthy", "high-protein"],
          "nutritionFacts": {
            "calories": 350,
            "protein": 35,
            "carbs": 20,
            "fat": 10,
            "fiber": 5
          },
          "equipmentUsed": ["stove", "oven"]
        }
      ],
      "totalEstimatedCost": 85.00
    }
  ],
  "crossPlanOptimization": {
    "sharedIngredients": [
      {
        "name": "yellow onion",
        "totalAmount": 3,
        "unit": "lbs",
        "usedInPlans": ["Adult Meal Plan", "Kids Meal Plan"],
        "estimatedSavings": 2.50
      }
    ],
    "consolidatedShoppingList": [
      {
        "name": "chicken breast",
        "totalAmount": 4,
        "unit": "lbs",
        "category": "protein",
        "estimatedPrice": 18.00,
        "aisle": "Meat"
      }
    ],
    "totalSavings": 25.00,
    "wasteReduction": "Used chicken and vegetables across 3 meal plans"
  },
  "nutritionSummary": {
    "overallAverages": {
      "calories": 450,
      "protein": 35,
      "carbs": 45,
      "fat": 15,
      "fiber": 8
    },
    "planComparisons": [
      {
        "planName": "Adult Meal Plan",
        "dailyAverages": {
          "calories": 500,
          "protein": 40,
          "carbs": 50,
          "fat": 18,
          "fiber": 10
        }
      }
    ]
  }
}`;

  try {
    console.log("Sending multi-meal plan request to OpenAI with model gpt-4o");
    console.log("Request meal plans:", request.mealPlans.map(p => `${p.name} (${p.mealCount} meals)`));
    console.log("Full meal plan details:", request.mealPlans.map(p => ({
      name: p.name,
      mealCount: p.mealCount,
      duration: p.duration,
      targetGroup: p.targetGroup,
      goals: p.goals,
      mealTypes: p.mealTypes
    })));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8000,
    });

    console.log("OpenAI multi-meal plan response received");
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    console.log("Raw OpenAI response length:", content.length);
    console.log("Raw OpenAI response preview:", content.substring(0, 1000));
    
    console.log("Parsing OpenAI multi-meal plan response");
    const generatedPlan: GeneratedMultiMealPlan = JSON.parse(content);
    
    console.log("Generated multi-meal plan with", generatedPlan.mealPlans?.length || 0, "plans");
    if (generatedPlan.mealPlans && generatedPlan.mealPlans.length > 0) {
      generatedPlan.mealPlans.forEach((plan, index) => {
        console.log(`Plan ${index + 1}: ${plan.name} has ${plan.meals?.length || 0} meals`);
      });
    }
    
    // Check if crossPlanOptimization exists
    if (generatedPlan.crossPlanOptimization) {
      console.log("CrossPlanOptimization found with", generatedPlan.crossPlanOptimization.sharedIngredients?.length || 0, "shared ingredients");
    } else {
      console.log("WARNING: No crossPlanOptimization found in response");
    }
    
    return generatedPlan;
  } catch (error) {
    console.error("Error generating multi-meal plan:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Failed to generate multi-meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function optimizeIngredients(ingredients: string[]): Promise<{
  groupedIngredients: Record<string, string[]>;
  suggestions: string[];
  estimatedSavings: number;
}> {
  const prompt = `Analyze these ingredients and provide optimization suggestions:
${ingredients.join('\n')}

Please provide:
1. Grouped ingredients by category
2. Suggestions for ingredient substitutions that could reduce costs
3. Estimated savings percentage from optimization

Respond in JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert in grocery shopping optimization and cost reduction." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error optimizing ingredients:", error);
    throw new Error(`Failed to optimize ingredients: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateRecipeVariations(recipeName: string, dietaryRestrictions: string[]): Promise<{
  variations: Array<{
    name: string;
    modifications: string[];
    ingredients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
    instructions: string;
  }>;
}> {
  const prompt = `Create 3 variations of "${recipeName}" that accommodate these dietary restrictions: ${dietaryRestrictions.join(', ')}

Each variation should:
1. Maintain the core flavors and appeal
2. Be safe for the specified restrictions
3. Include complete ingredient lists and instructions
4. Be practical for home cooking

Respond in JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a professional chef specializing in dietary accommodations and recipe modifications." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating recipe variations:", error);
    throw new Error(`Failed to generate recipe variations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
