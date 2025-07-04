import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Utensils, Users, Calendar, DollarSign, Leaf, ShoppingCart, Bell, Plus, Edit, Bot, Brush } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MealPlanCard from "@/components/MealPlanCard";
import GroceryListCard from "@/components/GroceryListCard";
import NutritionGoalsCard from "@/components/NutritionGoalsCard";
import MealPlanModal from "@/components/MealPlanModal";
import { useState } from "react";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);

  // Handle unauthorized errors
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: mealPlans, isLoading: mealPlansLoading } = useQuery({
    queryKey: ["/api/meal-plans"],
    enabled: !!user,
    retry: false,
  });

  const { data: householdMembers, isLoading: householdLoading } = useQuery({
    queryKey: ["/api/household-members"],
    enabled: !!user,
    retry: false,
  });

  const { data: nutritionGoals, isLoading: nutritionLoading } = useQuery({
    queryKey: ["/api/nutrition-goals"],
    enabled: !!user,
    retry: false,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const activeMealPlans = mealPlans?.filter((plan: any) => plan.status === 'active') || [];
  const currentMealPlan = activeMealPlans[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Utensils className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900">FoodGo</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-primary font-medium">
                Meal Plans
              </Link>
              <Link href="/recipes" className="text-gray-500 hover:text-gray-700">
                Recipes
              </Link>
              <Link href="/grocery-lists" className="text-gray-500 hover:text-gray-700">
                Grocery Lists
              </Link>
              <Link href="/household-setup" className="text-gray-500 hover:text-gray-700">
                Profile
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user?.firstName || "Friend"}!
            </h2>
            {(!householdMembers || householdMembers.length === 0) ? (
              <>
                <p className="text-blue-100 mb-4">
                  Let's start by setting up your family profile to get personalized meal plans!
                </p>
                <Button 
                  className="bg-white text-primary font-semibold hover:bg-gray-100"
                  asChild
                >
                  <Link href="/household-setup">
                    <Users className="h-4 w-4 mr-2" />
                    Set Up Your Family
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-blue-100 mb-4">
                  Ready to plan your next week of delicious, budget-friendly meals?
                </p>
                <Button 
                  className="bg-white text-primary font-semibold hover:bg-gray-100"
                  onClick={() => setShowMealPlanModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Meal Plan
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-primary mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Plans</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeMealPlans.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-secondary mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Weekly Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${currentMealPlan?.budget || "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Leaf className="h-8 w-8 text-accent mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nutrition Goals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {nutritionGoals?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-red-500 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Family Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {householdMembers?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Meal Plan */}
          <div className="lg:col-span-2">
            {currentMealPlan ? (
              <MealPlanCard mealPlan={currentMealPlan} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Meal Plans</CardTitle>
                  <CardDescription>
                    Get started by creating your first meal plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Utensils className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      Create your first meal plan to get personalized recipes and grocery lists
                    </p>
                    <Button 
                      onClick={() => setShowMealPlanModal(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Meal Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Grocery List */}
            <GroceryListCard mealPlan={currentMealPlan} />

            {/* Nutrition Goals */}
            <NutritionGoalsCard goals={nutritionGoals} />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowMealPlanModal(true)}
                  >
                    <Bot className="h-4 w-4 mr-3 text-primary" />
                    Generate AI Meal Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/household-setup">
                      <Users className="h-4 w-4 mr-3 text-secondary" />
                      Edit Household
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/household-setup">
                      <Brush className="h-4 w-4 mr-3 text-accent" />
                      Cooking Equipment
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Meal Plan Modal */}
      <MealPlanModal 
        isOpen={showMealPlanModal}
        onClose={() => setShowMealPlanModal(false)}
        householdMembers={householdMembers}
      />
    </div>
  );
}
