import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, Users, DollarSign, ShoppingCart, Target, ChefHat } from "lucide-react";
import { ConsolidatedIngredientsModal } from "@/components/ConsolidatedIngredientsModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MealPlan {
  id: number;
  name: string;
  targetGroup: string;
  startDate: string;
  endDate: string;
  duration: number;
  budget?: number;
  totalCost?: number | string;
  goals: string[];
  mealTypes: string[];
  status: string;
}

interface MealPlanGroup {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  mealPlans: MealPlan[];
}

interface Meal {
  id: number;
  date: string;
  mealType: string;
  servings: number;
  recipe: {
    id: number;
    name: string;
    description: string;
    prepTime: number;
    cookTime: number;
    difficulty: string;
    cuisine: string;
    nutritionFacts?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
    };
  };
}

interface GroceryListItem {
  id: number;
  name: string;
  amount: number;
  unit: string;
  category: string;
  estimatedPrice: number;
  aisle?: string;
}

interface ConsolidatedGroceryList {
  id: string;
  name: string;
  totalCost: string;
  items: GroceryListItem[];
}

export default function MealPlanGroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConsolidatedIngredients, setShowConsolidatedIngredients] = useState(false);

  const { data: mealPlanGroup, isLoading: groupLoading } = useQuery({
    queryKey: [`/api/meal-plan-groups/${groupId}`],
    enabled: !!groupId,
  });

  const { data: consolidatedGroceryList, isLoading: groceryLoading } = useQuery({
    queryKey: [`/api/meal-plan-groups/${groupId}/consolidated-grocery-list`],
    enabled: !!groupId,
  });

  const { data: mealsData = {} } = useQuery({
    queryKey: [`/api/meals/by-plans`],
    enabled: !!mealPlanGroup?.mealPlans?.length,
    queryFn: async () => {
      if (!mealPlanGroup?.mealPlans) return {};
      
      const mealsPromises = mealPlanGroup.mealPlans.map(async (plan: MealPlan) => {
        const response = await fetch(`/api/meals/${plan.id}`);
        if (!response.ok) return { planId: plan.id, meals: [] };
        const meals = await response.json();
        return { planId: plan.id, meals };
      });
      
      const results = await Promise.all(mealsPromises);
      return results.reduce((acc, { planId, meals }) => {
        acc[planId] = meals;
        return acc;
      }, {} as Record<number, Meal[]>);
    },
  });

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meal plan group...</p>
        </div>
      </div>
    );
  }

  if (!mealPlanGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Meal Plan Group Not Found</h2>
          <p className="text-gray-600 mb-4">The meal plan group you're looking for doesn't exist.</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const totalBudget = mealPlanGroup.mealPlans.reduce((sum: number, plan: MealPlan) => sum + (plan.budget || 0), 0);
  const totalCost = mealPlanGroup.mealPlans.reduce((sum: number, plan: MealPlan) => sum + (parseFloat(plan.totalCost as string) || 0), 0);
  const totalMeals = Object.values(mealsData).reduce((sum: number, meals: Meal[]) => sum + meals.length, 0);

  const categorizedGroceryItems = consolidatedGroceryList?.items?.reduce((acc: Record<string, GroceryListItem[]>, item: GroceryListItem) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mealPlanGroup.name}</h1>
              <p className="text-gray-600 mt-1">{mealPlanGroup.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Created: {new Date(mealPlanGroup.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{mealPlanGroup.mealPlans.length}</div>
                <div className="text-sm text-gray-600">Plans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalMeals}</div>
                <div className="text-sm text-gray-600">Meals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${totalCost.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="mt-6">
              <button
                onClick={() => setShowConsolidatedIngredients(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>View Consolidated Ingredients</span>
              </button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="meals">All Meals</TabsTrigger>
            <TabsTrigger value="grocery">Consolidated Grocery List</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Meal Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mealPlanGroup.mealPlans.map((plan: MealPlan) => (
                <Card key={plan.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{plan.targetGroup}</p>
                      </div>
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                        {plan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {plan.duration} days
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ChefHat className="h-4 w-4 mr-2" />
                        {mealsData[plan.id]?.length || 0} meals
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ${(parseFloat(plan.totalCost as string) || 0).toFixed(2)}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.goals.slice(0, 3).map((goal: string) => (
                          <Badge key={goal} variant="outline" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link to={`/meal-plan/${plan.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="meals" className="space-y-6">
            {mealPlanGroup.mealPlans.map((plan: MealPlan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{plan.name} Meals</span>
                    <Badge>{mealsData[plan.id]?.length || 0} meals</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mealsData[plan.id]?.map((meal: Meal) => (
                      <div key={meal.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{meal.recipe.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {meal.mealType}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{meal.recipe.description}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {meal.recipe.prepTime + meal.recipe.cookTime} min
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {meal.servings}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(meal.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="grocery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Consolidated Grocery List</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${consolidatedGroceryList?.totalCost || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groceryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading grocery list...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(categorizedGroceryItems).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {items.map((item: GroceryListItem) => (
                            <div key={item.id} className="border rounded-lg p-3 bg-white">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {item.amount} {item.unit}
                                  </p>
                                  {item.aisle && (
                                    <p className="text-xs text-gray-500">Aisle: {item.aisle}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900">
                                    ${item.estimatedPrice.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Consolidated Ingredients Modal */}
      <ConsolidatedIngredientsModal
        isOpen={showConsolidatedIngredients}
        onClose={() => setShowConsolidatedIngredients(false)}
        groupId={parseInt(groupId || '0')}
        title={mealPlanGroup ? `${mealPlanGroup.name} - Consolidated Ingredients` : undefined}
      />
    </div>
  );
}