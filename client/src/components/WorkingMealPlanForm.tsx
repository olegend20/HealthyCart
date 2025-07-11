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
    selectedMembers: [] as number[]
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
          duration: 7,
          goals: ['Family-friendly recipes'],
          mealTypes: ['dinner'],
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
        selectedMembers: []
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