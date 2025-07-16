import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Link } from "wouter";
import { apiRequest } from "../lib/queryClient";

interface Recipe {
  id: number;
  name: string;
  description: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  tags: string[];
  nutritionFacts: any;
  imageUrl?: string;
}

interface RecipeIngredient {
  id: number;
  name: string;
  amount: string;
  unit: string;
  category: string;
  optional: boolean;
}

interface CustomizedRecipe {
  name: string;
  description: string;
  instructions: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  tags: string[];
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    category: string;
    optional: boolean;
  }>;
}

export default function RecipeCustomizer() {
  const [match, params] = useRoute("/recipe/:id/customize");
  const recipeId = params?.id;
  const [customizedRecipe, setCustomizedRecipe] = useState<CustomizedRecipe | null>(null);
  const [modifications, setModifications] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const queryClient = useQueryClient();

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['/api/recipes', recipeId],
    queryFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) throw new Error('Recipe not found');
      return response.json();
    },
    enabled: !!recipeId
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['/api/recipes', recipeId, 'ingredients'],
    queryFn: async () => {
      const response = await fetch(`/api/recipes/${recipeId}/ingredients`);
      return response.json();
    },
    enabled: !!recipeId
  });

  const customizeRecipeMutation = useMutation({
    mutationFn: async (customizationData: any) => {
      return apiRequest(`/api/recipes/${recipeId}/customize`, "POST", customizationData);
    },
    onSuccess: (data) => {
      setCustomizedRecipe(data);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("Error customizing recipe:", error);
      setIsGenerating(false);
    }
  });

  const saveCustomizedRecipeMutation = useMutation({
    mutationFn: async (recipeData: CustomizedRecipe) => {
      return apiRequest("/api/recipes", "POST", recipeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
    }
  });

  useEffect(() => {
    if (recipe && ingredients.length > 0 && servingMultiplier !== 1) {
      const scaledIngredients = ingredients.map((ingredient: RecipeIngredient) => ({
        ...ingredient,
        amount: (parseFloat(ingredient.amount) * servingMultiplier).toString()
      }));
      
      setCustomizedRecipe({
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        servings: Math.round(recipe.servings * servingMultiplier),
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        tags: recipe.tags,
        ingredients: scaledIngredients
      });
    }
  }, [recipe, ingredients, servingMultiplier]);

  const handleCustomize = () => {
    if (!recipe || modifications.length === 0) return;

    setIsGenerating(true);
    customizeRecipeMutation.mutate({
      originalRecipe: recipe,
      ingredients: ingredients,
      modifications: modifications,
      servingMultiplier: servingMultiplier
    });
  };

  const handleSaveCustomized = () => {
    if (!customizedRecipe) return;
    saveCustomizedRecipeMutation.mutate(customizedRecipe);
  };

  const modificationOptions = [
    { id: 'healthier', label: 'Make it healthier', description: 'Reduce calories, fat, or sodium' },
    { id: 'vegetarian', label: 'Make it vegetarian', description: 'Remove meat ingredients' },
    { id: 'vegan', label: 'Make it vegan', description: 'Remove all animal products' },
    { id: 'gluten-free', label: 'Make it gluten-free', description: 'Replace gluten-containing ingredients' },
    { id: 'dairy-free', label: 'Make it dairy-free', description: 'Remove dairy products' },
    { id: 'low-carb', label: 'Make it low-carb', description: 'Reduce carbohydrate content' },
    { id: 'protein-boost', label: 'Add more protein', description: 'Increase protein content' },
    { id: 'kid-friendly', label: 'Make it kid-friendly', description: 'Adjust flavors for children' },
    { id: 'spicier', label: 'Make it spicier', description: 'Add heat and spice' },
    { id: 'milder', label: 'Make it milder', description: 'Reduce strong flavors' },
    { id: 'quicker', label: 'Make it quicker', description: 'Reduce preparation time' },
    { id: 'budget-friendly', label: 'Make it budget-friendly', description: 'Use cheaper ingredients' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
          <Link to="/recipes" className="text-blue-600 hover:text-blue-700">
            Back to Recipe Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customize Recipe</h1>
            <p className="text-gray-600 mt-1">
              Modify "{recipe.name}" to suit your preferences
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/recipes"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Library
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original Recipe */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Original Recipe</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{recipe.name}</h3>
                <p className="text-gray-600 text-sm">{recipe.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Prep Time:</span> {recipe.prepTime} min
                </div>
                <div>
                  <span className="font-medium">Cook Time:</span> {recipe.cookTime} min
                </div>
                <div>
                  <span className="font-medium">Servings:</span> {recipe.servings}
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span> {recipe.difficulty}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Ingredients</h4>
                <div className="space-y-1">
                  {ingredients.map((ingredient: RecipeIngredient) => (
                    <div key={ingredient.id} className="flex justify-between text-sm">
                      <span>{ingredient.name}</span>
                      <span className="text-gray-500">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Customization Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customization Options</h2>
            
            {/* Serving Size Adjustment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjust Serving Size
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <span className="text-lg font-medium">
                  {Math.round(recipe.servings * servingMultiplier)} servings
                </span>
                <button
                  onClick={() => setServingMultiplier(servingMultiplier + 0.5)}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* Modification Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recipe Modifications
              </label>
              <div className="space-y-2">
                {modificationOptions.map((option) => (
                  <label key={option.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={modifications.includes(option.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setModifications([...modifications, option.id]);
                        } else {
                          setModifications(modifications.filter(m => m !== option.id));
                        }
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleCustomize}
              disabled={isGenerating || modifications.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Customizing Recipe...</span>
                </div>
              ) : (
                `Generate Customized Recipe${modifications.length > 0 ? ` (${modifications.length} modifications)` : ''}`
              )}
            </button>
          </div>
        </div>

        {/* Customized Recipe Result */}
        {customizedRecipe && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Customized Recipe</h2>
              <button
                onClick={handleSaveCustomized}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Save to Library
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{customizedRecipe.name}</h3>
                <p className="text-gray-600 text-sm">{customizedRecipe.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Prep Time:</span> {customizedRecipe.prepTime} min
                </div>
                <div>
                  <span className="font-medium">Cook Time:</span> {customizedRecipe.cookTime} min
                </div>
                <div>
                  <span className="font-medium">Servings:</span> {customizedRecipe.servings}
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span> {customizedRecipe.difficulty}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Updated Ingredients</h4>
                <div className="space-y-1">
                  {customizedRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{ingredient.name}</span>
                      <span className="text-gray-500">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                <div className="text-gray-700 text-sm whitespace-pre-line">
                  {customizedRecipe.instructions}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}