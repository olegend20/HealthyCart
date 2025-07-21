export interface Recipe {
  id: number;
  name: string;
  description?: string;
  instructions: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  difficulty?: string;
  cuisine?: string;
  tags?: string[];
  rating?: string;
  nutritionFacts?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  imageUrl?: string;
  createdAt?: string;
}

export interface RecipeIngredient {
  id: number;
  name: string;
  amount: string;
  unit: string;
  category: string;
  optional: boolean;
}

export interface SelectedRecipe {
  recipeId: number;
  recipe: Recipe;
  assignments: Array<{
    date: string; // ISO date string
    mealType: string;
    servings: number;
  }>;
}