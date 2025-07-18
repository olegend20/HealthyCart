import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MealPlanWizard from "../components/MealPlanWizard";
import MultiMealPlanDemo from "../components/MultiMealPlanDemo";

export default function Home() {
  const [showWizard, setShowWizard] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const { data: mealPlanGroups = [], error: groupsError } = useQuery({
    queryKey: ['/api/meal-plan-groups'],
  });

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['/api/meal-plans'],
  });

  const { data: householdMembers = [] } = useQuery({
    queryKey: ['/api/household-members'],
  });

  // Group individual meal plans by groupId, always use this approach for now
  const displayData = mealPlans.reduce((groups: any[], plan: any) => {
    if (plan.groupId) {
      let group = groups.find(g => g.id === plan.groupId);
      if (!group) {
        group = {
          id: plan.groupId,
          name: `Week ${plan.groupId}`,
          description: 'Coordinated meal plans for multiple target groups',
          createdAt: plan.createdAt,
          mealPlans: []
        };
        groups.push(group);
      }
      group.mealPlans.push(plan);
    } else {
      // For individual plans without groups, create a single-plan group
      groups.push({
        id: `single-${plan.id}`,
        name: plan.name,
        description: plan.targetGroup,
        createdAt: plan.createdAt,
        mealPlans: [plan]
      });
    }
    return groups;
  }, []);

  const recentMealPlanGroups = displayData.slice(0, 3);

  // Debug logging
  console.log('Meal plan groups:', mealPlanGroups);
  console.log('Meal plans:', mealPlans);
  console.log('Display data:', displayData);
  console.log('Groups error:', groupsError);

  if (showWizard) {
    return (
      <MealPlanWizard
        onSuccess={() => setShowWizard(false)}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to FoodGo
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered meal planning that saves time and reduces food waste
          </p>
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Hello, {user.displayName || user.email}!
                </h2>
                <p className="text-gray-600">
                  Ready to plan your next meals?
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDemo(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  View Demo
                </button>
                <button
                  onClick={() => setShowWizard(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create New Meal Plan
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">Multi-Meal Plan Groups</h3>
                <p className="text-2xl font-bold text-blue-600">{displayData.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-900">Household Members</h3>
                <p className="text-2xl font-bold text-green-600">{householdMembers.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-900">Total Meal Plans</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {displayData.reduce((total: number, group: any) => total + (group.mealPlans?.length || 0), 0)}
                </p>
              </div>
            </div>

            {/* Recent Meal Plan Groups */}
            {recentMealPlanGroups.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Multi-Meal Plan Groups
                </h3>
                <div className="space-y-3">
                  {recentMealPlanGroups.map((group: any) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{group.name}</h4>
                          <p className="text-sm text-gray-600">
                            {group.mealPlans?.length || 0} meal plans • {group.description}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Created: {new Date(group.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {group.mealPlans?.map((plan: any) => (
                              <span key={plan.id} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {plan.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Total Cost: ${group.mealPlans?.reduce((total: number, plan: any) => total + parseFloat(plan.totalCost || '0'), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Link
                          to={`/meal-plan-group/${group.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Group Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {displayData.length > 3 && (
                  <div className="text-center mt-4">
                    <Link
                      to="/meal-plan-groups"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All Meal Plan Groups
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Multi-Target Planning
              </h3>
              <p className="text-gray-600 text-sm">
                Create separate meal plans for adults, kids, and dietary restrictions with intelligent ingredient sharing
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cost Optimization
              </h3>
              <p className="text-gray-600 text-sm">
                Reduce food waste and save money through ingredient overlap and bulk purchasing strategies
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI-Powered
              </h3>
              <p className="text-gray-600 text-sm">
                Personalized meal suggestions based on preferences, dietary restrictions, and nutrition goals
              </p>
            </div>
          </div>
        </div>

        {/* Setup Guide */}
        {householdMembers.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Get Started
            </h3>
            <p className="text-yellow-700 mb-4">
              Set up your household members and preferences to get personalized meal plans.
            </p>
            <div className="space-y-2">
              <Link
                to="/household"
                className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 font-medium mr-3"
              >
                Add Household Members
              </Link>
              <Link
                to="/cooking-equipment"
                className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium"
              >
                Set Up Cooking Equipment
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {showDemo && (
        <MultiMealPlanDemo onClose={() => setShowDemo(false)} />
      )}
    </div>
  );
}