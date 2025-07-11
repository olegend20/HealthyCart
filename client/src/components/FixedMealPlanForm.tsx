import React, { useState, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Bot, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface FixedMealPlanFormProps {
  householdMembers: HouseholdMember[];
  onSuccess?: () => void;
}

const GOAL_OPTIONS = [
  "More vegetables for kids",
  "Quick weeknight meals",
  "Maximize slow cooker usage",
  "Budget-friendly options",
  "High protein meals",
  "Low carb options",
  "Family-friendly recipes",
  "Hidden vegetables",
  "Meal prep friendly"
];

const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snacks" }
];

export default function FixedMealPlanForm({ householdMembers, onSuccess }: FixedMealPlanFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    duration: 7,
    budget: '',
    startDate: new Date(),
    goals: [] as string[],
    mealTypes: ['dinner'] as string[],
    selectedMembers: [] as number[]
  });

  const generateMealPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/meal-plans/generate", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully.",
      });
      // Reset form
      setFormData({
        name: '',
        duration: 7,
        budget: '',
        startDate: new Date(),
        goals: [],
        mealTypes: ['dinner'],
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

  // Memoized handlers to prevent re-renders
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleDurationChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, duration: parseInt(value) }));
  }, []);

  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, budget: e.target.value }));
  }, []);

  const handleStartDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, startDate: date }));
    }
  }, []);

  const handleMemberToggle = useCallback((memberId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  }, []);

  const handleGoalToggle = useCallback((goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  }, []);

  const handleMealTypeToggle = useCallback((mealType: string) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter(m => m !== mealType)
        : [...prev.mealTypes, mealType]
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for your meal plan.",
        variant: "destructive",
      });
      return;
    }

    if (householdMembers.length === 0) {
      toast({
        title: "Setup Required",
        description: "Please add household members first in the Profile section.",
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
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      goals: formData.goals,
      mealTypes: formData.mealTypes,
      startDate: formData.startDate.toISOString(),
      selectedMembers: formData.selectedMembers
    };

    generateMealPlanMutation.mutate(requestData);
  }, [formData, householdMembers.length, toast, generateMealPlanMutation]);

  // Memoized class names to prevent re-renders
  const getMemberClassName = useCallback((memberId: number) => {
    const isSelected = formData.selectedMembers.includes(memberId);
    return `p-3 border rounded-lg cursor-pointer transition-colors ${
      isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
    }`;
  }, [formData.selectedMembers]);

  const getGoalClassName = useCallback((goal: string) => {
    const isSelected = formData.goals.includes(goal);
    return `p-2 text-sm border rounded cursor-pointer transition-colors ${
      isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-gray-50'
    }`;
  }, [formData.goals]);

  const getMealTypeClassName = useCallback((mealType: string) => {
    const isSelected = formData.mealTypes.includes(mealType);
    return `px-3 py-2 border rounded cursor-pointer transition-colors ${
      isSelected ? 'bg-secondary text-secondary-foreground border-secondary' : 'hover:bg-gray-50'
    }`;
  }, [formData.mealTypes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>Generate New Meal Plan</span>
        </CardTitle>
        <CardDescription>
          Create a personalized meal plan using AI based on your household preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Meal Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Family Week Nov 4-10"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Planning Duration</Label>
              <Select value={formData.duration.toString()} onValueChange={handleDurationChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">Budget Target (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <Input
                  id="budget"
                  type="number"
                  className="pl-8"
                  value={formData.budget}
                  onChange={handleBudgetChange}
                  placeholder="80.00"
                  step="0.01"
                />
              </div>
            </div>
            
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Household Member Selection */}
          <div>
            <Label className="flex items-center space-x-2 mb-3">
              <Users className="h-4 w-4" />
              <span>Select Household Members</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {householdMembers.map((member) => (
                <div
                  key={member.id}
                  className={getMemberClassName(member.id)}
                  onClick={() => handleMemberToggle(member.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={formData.selectedMembers.includes(member.id)}
                      readOnly
                      className="pointer-events-none"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      {member.age && <div className="text-sm text-gray-500">{member.age} years old</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <Label className="mb-3 block">Meal Planning Goals</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <div
                  key={goal}
                  className={getGoalClassName(goal)}
                  onClick={() => handleGoalToggle(goal)}
                >
                  {goal}
                </div>
              ))}
            </div>
          </div>

          {/* Meal Types */}
          <div>
            <Label className="mb-3 block">Meal Types to Include</Label>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPE_OPTIONS.map((mealType) => (
                <div
                  key={mealType.value}
                  className={getMealTypeClassName(mealType.value)}
                  onClick={() => handleMealTypeToggle(mealType.value)}
                >
                  {mealType.label}
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={generateMealPlanMutation.isPending}
          >
            {generateMealPlanMutation.isPending ? "Generating Meal Plan..." : "Generate Meal Plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}