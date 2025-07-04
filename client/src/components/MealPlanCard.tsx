import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, MoreHorizontal, Star, Clock, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MealPlan {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: string;
  budget?: number;
}

interface MealPlanCardProps {
  mealPlan: MealPlan;
}

export default function MealPlanCard({ mealPlan }: MealPlanCardProps) {
  const { data: mealPlanDetails, isLoading } = useQuery({
    queryKey: ["/api/meal-plans", mealPlan.id],
    enabled: !!mealPlan.id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const meals = mealPlanDetails?.meals || [];
  const displayMeals = meals.slice(0, 3); // Show first 3 meals

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <LoadingSpinner size="sm" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {mealPlan.name}
            </CardTitle>
            <CardDescription className="flex items-center space-x-2">
              <span>
                {formatDate(mealPlan.startDate)} - {formatDate(mealPlan.endDate)}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {displayMeals.length > 0 ? (
            displayMeals.map((meal: any) => (
              <div key={meal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{meal.recipe.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="capitalize">
                        {new Date(meal.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {meal.servings} servings
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {(meal.recipe.prepTime || 0) + (meal.recipe.cookTime || 0)} min
                      </span>
                    </div>
                    {meal.recipe.rating && (
                      <div className="flex items-center mt-1">
                        <Star className="h-3 w-3 text-accent fill-current" />
                        <span className="text-xs text-gray-500 ml-1">
                          {parseFloat(meal.recipe.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-secondary">
                    ${parseFloat(meal.estimatedCost || "0").toFixed(2)}
                  </span>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No meals planned yet</p>
            </div>
          )}
          
          {meals.length > 3 && (
            <div className="text-center text-sm text-gray-500">
              +{meals.length - 3} more meals
            </div>
          )}
        </div>
        
        <Separator className="my-6" />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Total estimated cost:</span>
          <span className="text-lg font-semibold text-secondary">
            ${parseFloat(mealPlan.totalCost?.toString() || "0").toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
