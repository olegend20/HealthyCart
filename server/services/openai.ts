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
6. Estimate realistic costs based on average grocery prices
7. Include specific cooking instructions
8. Suggest ingredient substitutions for allergies/preferences

Please respond with a complete meal plan in JSON format with the exact structure specified in the TypeScript interface.`;

  try {
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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const generatedPlan: GeneratedMealPlan = JSON.parse(content);
    return generatedPlan;
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw new Error(`Failed to generate meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
