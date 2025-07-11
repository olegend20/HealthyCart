import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
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

interface DebugMealPlanFormProps {
  householdMembers: HouseholdMember[];
  onSuccess?: () => void;
}

export default function DebugMealPlanForm({ householdMembers, onSuccess }: DebugMealPlanFormProps) {
  const { toast } = useToast();
  
  // Use useCallback to prevent function recreation on every render
  const [formData, setFormData] = useState({
    name: '',
    duration: 7,
    selectedMembers: [] as number[]
  });

  const generateMealPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Making API request:", data);
      const response = await apiRequest("POST", "/api/meal-plans/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Meal plan generated successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully.",
      });
      // Reset form
      setFormData({
        name: '',
        duration: 7,
        selectedMembers: []
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error generating meal plan:", error);
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

  // Use useCallback to prevent function recreation
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Name change:", e.target.value);
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted:", formData);
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for your meal plan.",
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
  }, [formData, toast, generateMealPlanMutation]);

  console.log("DebugMealPlanForm render, formData:", formData);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>Debug Meal Plan Form</span>
        </CardTitle>
        <CardDescription>
          Debugging the infinite loop issue - simplified version
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Meal Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g., Dave's Week"
              required
            />
          </div>

          <div>
            <Label>Selected Members: {formData.selectedMembers.length}</Label>
            <p className="text-sm text-gray-500">
              {householdMembers.map(m => m.name).join(", ")}
            </p>
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