import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface MealPlanConfig {
  name: string;
  targetGroup: string;
  selectedMembers: number[];
  goals: string[];
  mealTypes: string[];
  duration: number;
  budget?: number;
}

interface MealPlanWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NUTRITION_GOALS = [
  "Reduced calories",
  "Higher protein", 
  "Increased vegetables",
  "Heart-healthy",
  "Low carb",
  "Gluten-free",
  "Dairy-free",
  "Kid-friendly",
  "Quick meals",
  "Budget-friendly"
];

const TARGET_GROUPS = [
  { value: "family", label: "Whole Family", description: "Meals suitable for all household members" },
  { value: "adults", label: "Adults Only", description: "Adult-focused meals with complex flavors" },
  { value: "kids", label: "Kids Only", description: "Kid-friendly meals with hidden vegetables" },
  { value: "dietary", label: "Dietary Restrictions", description: "Specialized meals for specific dietary needs" }
];

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", icon: "🌅" },
  { value: "lunch", label: "Lunch", icon: "🥗" },
  { value: "dinner", label: "Dinner", icon: "🍽️" },
  { value: "snacks", label: "Snacks", icon: "🍎" }
];

const DURATION_OPTIONS = [
  { value: 3, label: "3 Days", description: "Quick short-term planning" },
  { value: 7, label: "1 Week", description: "Standard weekly planning" },
  { value: 14, label: "2 Weeks", description: "Extended meal planning" }
];

export default function MealPlanWizard({ onSuccess, onCancel }: MealPlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [mealPlans, setMealPlans] = useState<MealPlanConfig[]>([
    {
      name: "",
      targetGroup: "family",
      selectedMembers: [],
      goals: [],
      mealTypes: ["dinner"],
      duration: 7,
      budget: undefined
    }
  ]);
  const [groupName, setGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: householdMembers = [] } = useQuery({
    queryKey: ["/api/household-members"],
  });

  const generateMealPlansMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/meal-plans/generate-multi", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      onSuccess?.();
    },
  });

  const updateMealPlan = (index: number, updates: Partial<MealPlanConfig>) => {
    setMealPlans(prev => prev.map((plan, i) => 
      i === index ? { ...plan, ...updates } : plan
    ));
  };

  const addMealPlan = () => {
    setMealPlans(prev => [...prev, {
      name: "",
      targetGroup: "family",
      selectedMembers: [],
      goals: [],
      mealTypes: ["dinner"],
      duration: 7,
      budget: undefined
    }]);
  };

  const removeMealPlan = (index: number) => {
    if (mealPlans.length > 1) {
      setMealPlans(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate all meal plans
      for (const plan of mealPlans) {
        if (!plan.name.trim()) {
          alert("Please provide a name for all meal plans.");
          setIsSubmitting(false);
          return;
        }
        if (plan.selectedMembers.length === 0) {
          alert("Please select household members for all meal plans.");
          setIsSubmitting(false);
          return;
        }
        if (plan.goals.length === 0) {
          alert("Please select at least one goal for each meal plan.");
          setIsSubmitting(false);
          return;
        }
      }

      await generateMealPlansMutation.mutateAsync({
        groupName: groupName || "Multi-Target Meal Planning",
        mealPlans: mealPlans.map(plan => ({
          ...plan,
          startDate: new Date().toISOString()
        }))
      });
      
    } catch (error) {
      console.error("Error generating meal plans:", error);
      alert("Failed to generate meal plans. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Plan Your Meals</h2>
        <p className="text-gray-600">Create customized meal plans for different groups in your household</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Plan Name (Optional)
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g., Weekly Family Meal Planning"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Multi-Target Planning</h3>
        <p className="text-sm text-blue-700">
          Create multiple meal plans for different groups (adults, kids, dietary restrictions) 
          with intelligent ingredient overlap to reduce costs and waste.
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Configure Meal Plans</h2>
        <button
          onClick={addMealPlan}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          Add Another Plan
        </button>
      </div>

      {mealPlans.map((plan, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Meal Plan {index + 1}
            </h3>
            {mealPlans.length > 1 && (
              <button
                onClick={() => removeMealPlan(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                value={plan.name}
                onChange={(e) => updateMealPlan(index, { name: e.target.value })}
                placeholder="e.g., Adult Dinner Plan"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Group
              </label>
              <select
                value={plan.targetGroup}
                onChange={(e) => updateMealPlan(index, { targetGroup: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {TARGET_GROUPS.map(group => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={plan.duration}
                onChange={(e) => updateMealPlan(index, { duration: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {DURATION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (Optional)
              </label>
              <input
                type="number"
                value={plan.budget || ""}
                onChange={(e) => updateMealPlan(index, { 
                  budget: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder="e.g., 100"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Household Members *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {householdMembers.map((member: HouseholdMember) => (
                <label key={member.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={plan.selectedMembers.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateMealPlan(index, {
                          selectedMembers: [...plan.selectedMembers, member.id]
                        });
                      } else {
                        updateMealPlan(index, {
                          selectedMembers: plan.selectedMembers.filter(id => id !== member.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal Types
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map(type => (
                <label key={type.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={plan.mealTypes.includes(type.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateMealPlan(index, {
                          mealTypes: [...plan.mealTypes, type.value]
                        });
                      } else {
                        updateMealPlan(index, {
                          mealTypes: plan.mealTypes.filter(t => t !== type.value)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {type.icon} {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nutritional Goals *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {NUTRITION_GOALS.map(goal => (
                <label key={goal} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={plan.goals.includes(goal)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateMealPlan(index, {
                          goals: [...plan.goals, goal]
                        });
                      } else {
                        updateMealPlan(index, {
                          goals: plan.goals.filter(g => g !== goal)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{goal}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review Your Plans</h2>
        <p className="text-gray-600">Confirm your meal plan configuration before generation</p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">Optimization Benefits</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Ingredients will be shared across meal plans to reduce waste</li>
          <li>• Cost savings through bulk ingredient usage</li>
          <li>• Consolidated shopping list for all plans</li>
        </ul>
      </div>

      {mealPlans.map((plan, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">{plan.name}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Target Group:</span> {TARGET_GROUPS.find(g => g.value === plan.targetGroup)?.label}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {plan.duration} days
            </div>
            <div>
              <span className="font-medium">Members:</span> {plan.selectedMembers.length} selected
            </div>
            <div>
              <span className="font-medium">Meals:</span> {plan.mealTypes.join(", ")}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Goals:</span> {plan.goals.join(", ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Setup</span>
          <span>Configure</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Generating..." : "Generate Meal Plans"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}