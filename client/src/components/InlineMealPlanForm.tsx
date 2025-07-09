import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface InlineMealPlanFormProps {
  householdMembers: HouseholdMember[];
  onSuccess?: () => void;
}

export default function InlineMealPlanForm({ householdMembers, onSuccess }: InlineMealPlanFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    duration: 7,
    selectedMembers: [] as number[]
  });

  const generateMealPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/meal-plans/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully.",
      });
      setFormData({
        name: '',
        duration: 7,
        selectedMembers: []
      });
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for your meal plan.",
        variant: "destructive",
      });
      return;
    }

    if (formData.selectedMembers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one household member for this meal plan.",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      name: formData.name,
      duration: formData.duration,
      goals: ['Family-friendly recipes'],
      mealTypes: ['dinner'],
      startDate: new Date().toISOString()
    };

    generateMealPlanMutation.mutate(requestData);
  };

  const handleMemberClick = (memberId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  };

  if (!householdMembers || householdMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Household Members</CardTitle>
          <CardDescription>Please add household members first in the Profile section.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
              placeholder="e.g., Family Week Nov 4-10"
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
            disabled={generateMealPlanMutation.isPending}
          >
            {generateMealPlanMutation.isPending ? "Generating..." : "Generate Meal Plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}