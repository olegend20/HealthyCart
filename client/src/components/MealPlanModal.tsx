import { useState, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Bot, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import SimpleHouseholdSelector from "@/components/SimpleHouseholdSelector";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HouseholdMember {
  id: number;
  name: string;
  dietaryRestrictions: string[];
  allergies: string[];
}

interface MealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdMembers?: HouseholdMember[];
}

export default function MealPlanModal({ isOpen, onClose, householdMembers = [] }: MealPlanModalProps) {
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully.",
      });
      resetForm();
      onClose();
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

  const resetForm = () => {
    setFormData({
      name: '',
      duration: 7,
      budget: '',
      startDate: new Date(),
      goals: [],
      mealTypes: ['dinner'],
      selectedMembers: [] as number[]
    });
  };

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
      startDate: formData.startDate.toISOString()
    };

    generateMealPlanMutation.mutate(requestData);
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const toggleMealType = (mealType: string) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter(m => m !== mealType)
        : [...prev.mealTypes, mealType]
    }));
  };

  const goalOptions = [
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

  const mealTypeOptions = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snacks" }
  ];

  const { restrictions, allergies } = useMemo(() => {
    if (!householdMembers || householdMembers.length === 0) {
      return { restrictions: [], allergies: [] };
    }
    
    const allRestrictions = householdMembers.flatMap(member => member.dietaryRestrictions || []);
    const allAllergies = householdMembers.flatMap(member => member.allergies || []);
    
    return {
      restrictions: [...new Set(allRestrictions)],
      allergies: [...new Set(allAllergies)]
    };
  }, [householdMembers]);

  const handleMemberSelectionChange = useCallback((memberIds: number[]) => {
    setFormData(prev => ({ ...prev, selectedMembers: memberIds || [] }));
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>Generate New Meal Plan</span>
          </DialogTitle>
          <DialogDescription>
            Create a personalized meal plan using AI based on your household preferences
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="duration">Planning Duration</Label>
              <Select value={formData.duration.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
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
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Meal Types to Include</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {mealTypeOptions.map(option => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={formData.mealTypes.includes(option.value)}
                    onCheckedChange={() => toggleMealType(option.value)}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Focus Goals</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {goalOptions.map(goal => (
                <Badge
                  key={goal}
                  variant={formData.goals.includes(goal) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </Badge>
              ))}
            </div>
          </div>

          {/* Household Member Selection */}
          <SimpleHouseholdSelector
            householdMembers={householdMembers || []}
            selectedMembers={formData.selectedMembers || []}
            onSelectionChange={handleMemberSelectionChange}
          />

          {(restrictions.length > 0 || allergies.length > 0) && (
            <div>
              <Label>Household Dietary Information</Label>
              <div className="space-y-2 mt-2">
                {restrictions.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Dietary Restrictions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {restrictions.map(restriction => (
                        <Badge key={restriction} variant="secondary" className="text-xs">
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {allergies.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Allergies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {allergies.map(allergy => (
                        <Badge key={allergy} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={generateMealPlanMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {generateMealPlanMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
