import React, { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, Clock, Users, DollarSign, CheckCircle, X } from "lucide-react";

interface MealPlan {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  budget?: string;
  goals: string[];
  status: string;
  totalCost?: string;
}

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
  nutritionFacts?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
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

interface Meal {
  id: number;
  date: string;
  mealType: string;
  servings: number;
  status: string;
  estimatedCost?: string;
  recipe: Recipe;
}

interface GroceryListItem {
  id: number;
  name: string;
  amount: number;
  unit: string;
  category: string;
  estimatedPrice: number;
  aisle?: string;
  purchased?: boolean;
}

interface GroceryList {
  id: number;
  name: string;
  totalCost: string;
  items: GroceryListItem[];
}

export default function MealPlanDetails() {
  const { id } = useParams<{ id: string }>();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<{ [key: number]: RecipeIngredient[] }>({});
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMealPlanData() {
      if (!id) return;
      
      try {
        // Load meal plan details
        const mealPlanResponse = await fetch(`/api/meal-plans/${id}`, { credentials: "include" });
        if (!mealPlanResponse.ok) {
          throw new Error("Failed to load meal plan");
        }
        const mealPlanData = await mealPlanResponse.json();
        setMealPlan(mealPlanData);

        // Load meals for this meal plan
        const mealsResponse = await fetch(`/api/meals/${id}`, { credentials: "include" });
        if (mealsResponse.ok) {
          const mealsData = await mealsResponse.json();
          setMeals(mealsData);

          // Load ingredients for each recipe
          const ingredientsMap: { [key: number]: RecipeIngredient[] } = {};
          for (const meal of mealsData) {
            const ingredientsResponse = await fetch(`/api/recipes/${meal.recipe.id}/ingredients`, { credentials: "include" });
            if (ingredientsResponse.ok) {
              const ingredientsData = await ingredientsResponse.json();
              ingredientsMap[meal.recipe.id] = ingredientsData;
            }
          }
          setRecipeIngredients(ingredientsMap);
        }

        // Load grocery list
        const groceryResponse = await fetch(`/api/grocery-lists/meal-plan/${id}`, { credentials: "include" });
        if (groceryResponse.ok) {
          const groceryData = await groceryResponse.json();
          if (groceryData.length > 0) {
            setGroceryList(groceryData[0]);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadMealPlanData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg">Loading meal plan...</p>
        </div>
      </div>
    );
  }

  if (error || !mealPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600">{error || "Meal plan not found"}</p>
          <Link href="/" className="text-blue-500 hover:underline mt-2 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMealsByDate = () => {
    const mealsByDate: { [key: string]: Meal[] } = {};
    meals.forEach(meal => {
      const dateKey = meal.date.split('T')[0];
      if (!mealsByDate[dateKey]) {
        mealsByDate[dateKey] = [];
      }
      mealsByDate[dateKey].push(meal);
    });
    return mealsByDate;
  };

  const mealsByDate = getMealsByDate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{mealPlan.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                mealPlan.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {mealPlan.status.charAt(0).toUpperCase() + mealPlan.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Meal Plan Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{formatDate(mealPlan.startDate)} - {formatDate(mealPlan.endDate)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-medium">${mealPlan.budget || 'No budget set'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="font-medium">${mealPlan.totalCost || '0.00'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Meals</p>
                <p className="font-medium">{meals.length} planned</p>
              </div>
            </div>
          </div>
          
          {/* Goals */}
          {mealPlan.goals && mealPlan.goals.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Nutrition Goals</h3>
              <div className="flex flex-wrap gap-2">
                {mealPlan.goals.map((goal, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Meals by Date */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Meal Schedule</h2>
            {meals.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(mealsByDate).map(([date, dateMeals]) => (
                  <div key={date} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    {formatDate(date + 'T00:00:00')}
                  </h3>
                  <div className="space-y-4">
                    {dateMeals.map((meal) => (
                      <div key={meal.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <button
                              onClick={() => setSelectedRecipe(meal.recipe)}
                              className="text-left hover:text-blue-600 transition-colors"
                            >
                              <h4 className="font-medium text-gray-900 hover:text-blue-600">{meal.recipe.name}</h4>
                              <p className="text-sm text-gray-500 capitalize">{meal.mealType} • {meal.servings} servings</p>
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">${meal.estimatedCost || '0.00'}</p>
                            <p className="text-xs text-gray-500">{meal.recipe.difficulty}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Prep: {meal.recipe.prepTime}m
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Cook: {meal.recipe.cookTime}m
                          </span>
                          {meal.recipe.cuisine && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {meal.recipe.cuisine}
                            </span>
                          )}
                        </div>

                        {meal.recipe.description && (
                          <p className="text-sm text-gray-600 mb-3">{meal.recipe.description}</p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mb-3">
                          <button
                            onClick={() => setSelectedRecipe(meal.recipe)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View Recipe & Instructions
                          </button>
                          <Link
                            to={`/recipe/${meal.recipe.id}/customize`}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Customize Recipe
                          </Link>
                        </div>

                        {/* Ingredients */}
                        {recipeIngredients[meal.recipe.id] && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Ingredients:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {recipeIngredients[meal.recipe.id].map((ingredient) => (
                                <div key={ingredient.id} className="flex justify-between text-sm">
                                  <span className={ingredient.optional ? 'text-gray-500' : 'text-gray-700'}>
                                    {ingredient.name} {ingredient.optional && '(optional)'}
                                  </span>
                                  <span className="text-gray-500">
                                    {ingredient.amount} {ingredient.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nutrition Facts */}
                        {meal.recipe.nutritionFacts && (
                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Nutrition (per serving):</h5>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                              {meal.recipe.nutritionFacts.calories && (
                                <div>
                                  <span className="text-gray-500">Calories:</span>
                                  <span className="ml-1 font-medium">{meal.recipe.nutritionFacts.calories}</span>
                                </div>
                              )}
                              {meal.recipe.nutritionFacts.protein && (
                                <div>
                                  <span className="text-gray-500">Protein:</span>
                                  <span className="ml-1 font-medium">{meal.recipe.nutritionFacts.protein}g</span>
                                </div>
                              )}
                              {meal.recipe.nutritionFacts.carbs && (
                                <div>
                                  <span className="text-gray-500">Carbs:</span>
                                  <span className="ml-1 font-medium">{meal.recipe.nutritionFacts.carbs}g</span>
                                </div>
                              )}
                              {meal.recipe.nutritionFacts.fat && (
                                <div>
                                  <span className="text-gray-500">Fat:</span>
                                  <span className="ml-1 font-medium">{meal.recipe.nutritionFacts.fat}g</span>
                                </div>
                              )}
                              {meal.recipe.nutritionFacts.fiber && (
                                <div>
                                  <span className="text-gray-500">Fiber:</span>
                                  <span className="ml-1 font-medium">{meal.recipe.nutritionFacts.fiber}g</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No meals have been generated yet</p>
                  <p className="text-sm text-gray-400">
                    This meal plan was created but may not have generated specific meals. 
                    The grocery list below contains suggested ingredients.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Grocery List Sidebar */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shopping List</h2>
            {groceryList ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">{groceryList.name}</h3>
                  <span className="text-sm font-medium text-gray-900">
                    Total: ${groceryList.totalCost}
                  </span>
                </div>
                <div className="space-y-2">
                  {groceryList.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {item.amount} {item.unit}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        ${typeof item.estimatedPrice === 'string' 
                          ? parseFloat(item.estimatedPrice.replace('$', '')).toFixed(2) || '0.00' 
                          : (item.estimatedPrice || 0).toFixed(2)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-gray-500">No grocery list available</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedRecipe.name}
                </h2>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedRecipe.imageUrl && (
                <img 
                  src={selectedRecipe.imageUrl} 
                  alt={selectedRecipe.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              <p className="text-gray-600 mb-4">{selectedRecipe.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedRecipe.prepTime}
                  </div>
                  <div className="text-sm text-gray-500">Prep Time (min)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedRecipe.cookTime}
                  </div>
                  <div className="text-sm text-gray-500">Cook Time (min)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedRecipe.servings}
                  </div>
                  <div className="text-sm text-gray-500">Servings</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    selectedRecipe.difficulty === 'easy' ? 'text-green-600' :
                    selectedRecipe.difficulty === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {selectedRecipe.difficulty}
                  </div>
                  <div className="text-sm text-gray-500">Difficulty</div>
                </div>
              </div>

              {/* Ingredients */}
              {recipeIngredients[selectedRecipe.id] && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Ingredients
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {recipeIngredients[selectedRecipe.id].map((ingredient: RecipeIngredient) => (
                      <div key={ingredient.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-900">
                          {ingredient.name}
                          {ingredient.optional && (
                            <span className="text-gray-500 text-sm ml-1">(optional)</span>
                          )}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {ingredient.amount} {ingredient.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cooking Instructions */}
              {selectedRecipe.instructions && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Cooking Instructions
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {selectedRecipe.instructions}
                    </div>
                  </div>
                </div>
              )}

              {/* Nutrition Facts */}
              {selectedRecipe.nutritionFacts && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Nutrition Facts (per serving)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {selectedRecipe.nutritionFacts.calories && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedRecipe.nutritionFacts.calories}
                        </div>
                        <div className="text-sm text-gray-500">Calories</div>
                      </div>
                    )}
                    {selectedRecipe.nutritionFacts.protein && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedRecipe.nutritionFacts.protein}g
                        </div>
                        <div className="text-sm text-gray-500">Protein</div>
                      </div>
                    )}
                    {selectedRecipe.nutritionFacts.carbs && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {selectedRecipe.nutritionFacts.carbs}g
                        </div>
                        <div className="text-sm text-gray-500">Carbs</div>
                      </div>
                    )}
                    {selectedRecipe.nutritionFacts.fat && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedRecipe.nutritionFacts.fat}g
                        </div>
                        <div className="text-sm text-gray-500">Fat</div>
                      </div>
                    )}
                    {selectedRecipe.nutritionFacts.fiber && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedRecipe.nutritionFacts.fiber}g
                        </div>
                        <div className="text-sm text-gray-500">Fiber</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Link
                  to={`/recipe/${selectedRecipe.id}/customize`}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 text-center font-medium"
                >
                  Customize This Recipe
                </Link>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}