import React, { useState } from "react";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface WorkingMealPlanFormProps {
  householdMembers: HouseholdMember[];
  onSuccess?: () => void;
}

export default function WorkingMealPlanForm({ householdMembers, onSuccess }: WorkingMealPlanFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    selectedMembers: [] as number[],
    goals: [] as string[],
    mealTypes: ['dinner'] as string[],
    duration: 7,
    budget: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Please enter a name for your meal plan.");
      return;
    }

    if (formData.selectedMembers.length === 0) {
      alert("Please select at least one household member for this meal plan.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/meal-plans/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          duration: formData.duration,
          goals: formData.goals.length > 0 ? formData.goals : ['Family-friendly recipes'],
          mealTypes: formData.mealTypes,
          budget: formData.budget > 0 ? formData.budget : undefined,
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert("Meal plan generated successfully!");
      
      // Reset form
      setFormData({
        name: '',
        selectedMembers: [],
        goals: [],
        mealTypes: ['dinner'],
        duration: 7,
        budget: 0
      });
      
      onSuccess?.();
      
    } catch (error) {
      console.error("Error generating meal plan:", error);
      alert("Failed to generate meal plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberToggle = (memberId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleMealTypeToggle = (mealType: string) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter(m => m !== mealType)
        : [...prev.mealTypes, mealType]
    }));
  };

  const availableGoals = [
    'Reduced calories',
    'Higher protein',
    'Quick meal prep',
    'Increased vegetables',
    'Budget-friendly',
    'Heart-healthy',
    'Low-carb',
    'Family-friendly recipes',
    'Meal prep friendly',
    'Gluten-free options'
  ];

  const availableMealTypes = [
    'breakfast',
    'lunch', 
    'dinner',
    'snacks'
  ];

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Create Meal Plan</h2>
        <p className="text-gray-600">Generate a personalized meal plan for your household</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meal Plan Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Dave's Family Week"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (Days)
          </label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={3}>3 days</option>
            <option value={7}>1 week</option>
            <option value={14}>2 weeks</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Budget (Optional)
          </label>
          <input
            type="number"
            value={formData.budget || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
            placeholder="e.g., 150"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Meal Types
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableMealTypes.map((mealType) => (
              <div
                key={mealType}
                className={`p-2 border rounded-md cursor-pointer transition-colors text-center ${
                  formData.mealTypes.includes(mealType)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => handleMealTypeToggle(mealType)}
              >
                <input
                  type="checkbox"
                  checked={formData.mealTypes.includes(mealType)}
                  onChange={() => {}}
                  className="mr-2"
                />
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Nutrition Goals
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableGoals.map((goal) => (
              <div
                key={goal}
                className={`p-2 border rounded-md cursor-pointer transition-colors text-center ${
                  formData.goals.includes(goal)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => handleGoalToggle(goal)}
              >
                <input
                  type="checkbox"
                  checked={formData.goals.includes(goal)}
                  onChange={() => {}}
                  className="mr-2"
                />
                <span className="text-sm">{goal}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Family Members
          </label>
          <div className="space-y-2">
            {householdMembers.map((member) => (
              <div
                key={member.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.selectedMembers.includes(member.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => handleMemberToggle(member.id)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.selectedMembers.includes(member.id)}
                    onChange={() => {}} // Handled by div onClick
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{member.name}</div>
                    {member.age && (
                      <div className="text-sm text-gray-500">Age: {member.age}</div>
                    )}
                    {member.dietaryRestrictions.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Dietary: {member.dietaryRestrictions.join(', ')}
                      </div>
                    )}
                    {member.allergies.length > 0 && (
                      <div className="text-sm text-red-600 mt-1">
                        Allergies: {member.allergies.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {formData.selectedMembers.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              Selected Members ({formData.selectedMembers.length})
            </div>
            <div className="text-sm text-blue-700">
              {householdMembers
                .filter(m => formData.selectedMembers.includes(m.id))
                .map(m => m.name)
                .join(', ')}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Generating..." : "Generate Meal Plan"}
        </button>
      </form>
    </div>
  );
}