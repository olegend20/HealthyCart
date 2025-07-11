import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Users } from "lucide-react";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface SimpleMealPlanFormProps {
  householdMembers: HouseholdMember[];
  onSuccess?: () => void;
}

export default function SimpleMealPlanForm({ householdMembers, onSuccess }: SimpleMealPlanFormProps) {
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
      // Simple fetch instead of using React Query mutation
      const response = await fetch("/api/meal-plans/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  const handleMemberClick = (memberId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>Create Meal Plan</span>
        </CardTitle>
        <CardDescription>
          Generate a personalized meal plan for your household
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Meal Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Dave's Family Week"
              required
            />
          </div>

          <div>
            <Label className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4" />
              <span>Select Family Members</span>
            </Label>
            <div className="space-y-2">
              {householdMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => handleMemberClick(member.id)}
                >
                  <Checkbox
                    checked={formData.selectedMembers.includes(member.id)}
                    readOnly
                    className="pointer-events-none"
                  />
                  <span className="font-medium">{member.name}</span>
                  {member.age && <span className="text-sm text-gray-500">({member.age} years)</span>}
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Generating..." : "Generate Meal Plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}