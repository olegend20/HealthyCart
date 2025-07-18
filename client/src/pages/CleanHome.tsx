import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Users, Calendar, DollarSign, Leaf, Bell, Plus, X } from "lucide-react";
import WorkingMealPlanForm from "@/components/WorkingMealPlanForm";
import UserProfile from "@/components/UserProfile";

interface User {
  id: string;
  email: string;
  firstName?: string;
}

interface MealPlan {
  id: number;
  name: string;
  status: string;
  budget?: number;
}

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

export default function CleanHome() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [showMealPlanForm, setShowMealPlanForm] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Load user
        const userResponse = await fetch("/api/auth/user", { credentials: "include" });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          // Load meal plans
          const mealPlansResponse = await fetch("/api/meal-plans", { credentials: "include" });
          if (mealPlansResponse.ok) {
            const mealPlansData = await mealPlansResponse.json();
            setMealPlans(mealPlansData);
          }

          // Load household members
          const householdResponse = await fetch("/api/household-members", { credentials: "include" });
          if (householdResponse.ok) {
            const householdData = await householdResponse.json();
            setHouseholdMembers(householdData);
          }
        } else {
          // Redirect to login if not authenticated
          window.location.href = "/api/login";
          return;
        }
      } catch (error) {
        console.error("Error loading data:", error);
        window.location.href = "/api/login";
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Group meal plans by groupId for consolidated display
  const groupedMealPlans = mealPlans.reduce((groups: any[], plan: any) => {
    if (plan.groupId) {
      let group = groups.find(g => g.id === plan.groupId);
      if (!group) {
        group = {
          id: plan.groupId,
          name: `Week ${plan.groupId}`,
          description: 'Coordinated meal plans for multiple target groups',
          createdAt: plan.createdAt,
          status: plan.status,
          budget: 0,
          mealPlans: []
        };
        groups.push(group);
      }
      group.mealPlans.push(plan);
      group.budget += parseFloat(plan.budget || '0');
    } else {
      // For individual plans without groups, create a single-plan group
      groups.push({
        id: `single-${plan.id}`,
        name: plan.name,
        description: plan.targetGroup || 'Individual meal plan',
        createdAt: plan.createdAt,
        status: plan.status,
        budget: parseFloat(plan.budget || '0'),
        mealPlans: [plan]
      });
    }
    return groups;
  }, []);

  const activeMealPlans = mealPlans.filter(plan => plan.status === 'active');
  const activeGroups = groupedMealPlans.filter(group => 
    group.mealPlans.some((plan: any) => plan.status === 'active')
  );
  const currentMealPlan = activeGroups[0];

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
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user.firstName || "Friend"}!
            </h2>
            {householdMembers.length === 0 ? (
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
                <div className="flex flex-wrap gap-3">
                  <Button 
                    className="bg-white text-primary font-semibold hover:bg-gray-100"
                    onClick={() => setShowMealPlanForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Meal Plan
                  </Button>
                  <Button 
                    className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    asChild
                  >
                    <Link href="/multi-meal-plan-generator">
                      <Users className="h-4 w-4 mr-2" />
                      Multi-Plan Generator
                    </Link>
                  </Button>
                </div>
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
                    {activeGroups.length}
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
                  <p className="text-2xl font-bold text-gray-900">0</p>
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
                    {householdMembers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Meal Plan */}
          <div className="lg:col-span-2">
            {currentMealPlan ? (
              <Card>
                <CardHeader>
                  <CardTitle>Current Meal Plan</CardTitle>
                  <CardDescription>{currentMealPlan.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium capitalize">{currentMealPlan.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Budget</p>
                        <p className="font-medium">${currentMealPlan.budget.toFixed(2) || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Meal Plans ({currentMealPlan.mealPlans.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {currentMealPlan.mealPlans.map((plan: any) => (
                          <span key={plan.id} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {plan.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button asChild className="flex-1">
                        <Link href={`/meal-plan-group/${currentMealPlan.id}`}>
                          View Group Details
                        </Link>
                      </Button>
                      <Button 
                        onClick={() => setShowMealPlanForm(true)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                      onClick={() => setShowMealPlanForm(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Meal Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Recent Meal Plan Groups */}
            {groupedMealPlans.length > 1 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Meal Plan Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupedMealPlans.slice(0, 3).map((group: any) => (
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{group.status}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {group.mealPlans.length} meal plans • ${group.budget.toFixed(2)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {group.mealPlans.map((plan: any) => (
                              <span key={plan.id} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {plan.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/meal-plan-group/${group.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowMealPlanForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-3 text-primary" />
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Meal Plan Form Modal */}
      {showMealPlanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create Meal Plan</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMealPlanForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <WorkingMealPlanForm 
              householdMembers={householdMembers}
              onSuccess={() => {
                setShowMealPlanForm(false);
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}