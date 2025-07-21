import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Bot, Utensils, ChefHat, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import RecipeSelectionModal from "@/components/RecipeSelectionModal";
import RecipeAssignmentGrid from "@/components/RecipeAssignmentGrid";
import { SelectedRecipe } from "@/types/recipe";

interface MealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MealPlanModal({ isOpen, onClose }: MealPlanModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    duration: 7,
    budget: '',
    startDate: new Date(),
    goals: [] as string[],
    mealTypes: ['dinner'] as string[]
  });

  // Recipe selection states
  const [includeExistingRecipes, setIncludeExistingRecipes] = useState(false);
  const [showRecipeSelection, setShowRecipeSelection] = useState(false);
  const [showRecipeAssignment, setShowRecipeAssignment] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<SelectedRecipe[]>([]);
  const [currentStep, setCurrentStep] = useState<'form' | 'recipe-selection' | 'recipe-assignment'>('form');

  const { data: householdMembers = [], isLoading: membersLoading } = useQuery<any[]>({
    queryKey: ["/api/household-members"],
    enabled: !!user && isOpen,
  });

  const { data: cookingEquipment = [], isLoading: equipmentLoading } = useQuery<any[]>({
    queryKey: ["/api/cooking-equipment"],
    enabled: !!user && isOpen,
  });

  const { data: userRecipes = [], isLoading: recipesLoading } = useQuery<any[]>({
    queryKey: ["/api/recipes"],
    enabled: !!user && includeExistingRecipes && isOpen,
  });

  const generateMealPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use mixed meal plan endpoint if recipes are selected, otherwise use regular endpoint
      const endpoint = data.selectedRecipes && data.selectedRecipes.length > 0 
        ? "/api/meal-plans/generate-mixed" 
        : "/api/meal-plans/generate";
      
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success!",
        description: "Your meal plan has been generated successfully.",
      });
      onClose();
      // Reset form
      setFormData({
        name: '',
        duration: 7,
        budget: '',
        startDate: new Date(),
        goals: [],
        mealTypes: ['dinner']
      });
      setSelectedRecipes([]);
      setCurrentStep('form');
      setIncludeExistingRecipes(false);
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

    if (!householdMembers || householdMembers.length === 0) {
      toast({
        title: "Setup Required",
        description: "Please add household members first in the Profile section.",
        variant: "destructive",
      });
      return;
    }

    // If including existing recipes, show recipe selection
    if (includeExistingRecipes && userRecipes.length > 0) {
      setCurrentStep('recipe-selection');
      setShowRecipeSelection(true);
      return;
    }

    // Otherwise proceed with regular generation
    const requestData = {
      name: formData.name,
      duration: formData.duration,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      goals: formData.goals,
      mealTypes: formData.mealTypes,
      startDate: formData.startDate.toISOString(),
      selectedRecipes: selectedRecipes.length > 0 ? selectedRecipes.flatMap(sr => 
        sr.assignments.map(assignment => ({
          recipeId: sr.recipeId,
          date: assignment.date,
          mealType: assignment.mealType,
          servings: assignment.servings
        }))
      ) : undefined
    };

    generateMealPlanMutation.mutate(requestData);
  };

  const handleRecipeSelection = (recipes: SelectedRecipe[]) => {
    setSelectedRecipes(recipes);
    setShowRecipeSelection(false);
    if (recipes.length > 0) {
      setCurrentStep('recipe-assignment');
      setShowRecipeAssignment(true);
    } else {
      setCurrentStep('form');
    }
  };

  const handleRecipeAssignmentUpdate = (updatedRecipes: SelectedRecipe[]) => {
    setSelectedRecipes(updatedRecipes);
  };

  const handleBackToRecipeSelection = () => {
    setCurrentStep('recipe-selection');
    setShowRecipeAssignment(false);
    setShowRecipeSelection(true);
  };

  const handleContinueFromAssignment = () => {
    setShowRecipeAssignment(false);
    setCurrentStep('form');
    
    // Proceed with meal plan generation
    const requestData = {
      name: formData.name,
      duration: formData.duration,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      goals: formData.goals,
      mealTypes: formData.mealTypes,
      startDate: formData.startDate.toISOString(),
      selectedRecipes: selectedRecipes.flatMap(sr => 
        sr.assignments.map(assignment => ({
          recipeId: sr.recipeId,
          date: assignment.date,
          mealType: assignment.mealType,
          servings: assignment.servings
        }))
      )
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
    "Meal prep friendly",
    "Seasonal ingredients",
    "One-pot meals",
    "Gluten-free options"
  ];

  const mealTypeOptions = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snacks" }
  ];

  const getDietaryInfo = () => {
    if (!householdMembers || householdMembers.length === 0) return { restrictions: [], allergies: [] };
    
    const allRestrictions = householdMembers.flatMap((member: any) => member.dietaryRestrictions || []);
    const allAllergies = householdMembers.flatMap((member: any) => member.allergies || []);
    
    return {
      restrictions: Array.from(new Set(allRestrictions)),
      allergies: Array.from(new Set(allAllergies))
    };
  };

  const { restrictions, allergies } = getDietaryInfo();

  const handleClose = () => {
    // Reset all states when closing
    setCurrentStep('form');
    setShowRecipeSelection(false);
    setShowRecipeAssignment(false);
    setSelectedRecipes([]);
    setIncludeExistingRecipes(false);
    onClose();
  };

  if (membersLoading || equipmentLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-lg">Loading your preferences...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen && currentStep === 'form'} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              AI Meal Plan Generator
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1">
            {/* Recipe Assignment Grid */}
            {showRecipeAssignment && (
              <div className="p-4">
                <RecipeAssignmentGrid
                  selectedRecipes={selectedRecipes}
                  mealPlanDuration={formData.duration}
                  selectedMealTypes={formData.mealTypes}
                  startDate={formData.startDate}
                  onUpdateAssignments={handleRecipeAssignmentUpdate}
                  onBack={handleBackToRecipeSelection}
                  onContinue={handleContinueFromAssignment}
                />
              </div>
            )}

            {/* Main Form */}
            {!showRecipeAssignment && (
              <form onSubmit={handleSubmit} className="space-y-6 p-6">
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
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {mealTypeOptions.map(option => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          checked={formData.mealTypes.includes(option.value)}
                          onCheckedChange={() => toggleMealType(option.value)}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Recipe Selection Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        <Label className="text-base font-medium">Include Existing Recipes</Label>
                      </div>
                      <p className="text-sm text-gray-500">
                        Add recipes from your library to the meal plan
                        {userRecipes.length > 0 && ` (${userRecipes.length} available)`}
                      </p>
                    </div>
                    <Switch
                      checked={includeExistingRecipes}
                      onCheckedChange={setIncludeExistingRecipes}
                    />
                  </div>

                  {includeExistingRecipes && selectedRecipes.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedRecipes.reduce((total, sr) => total + sr.assignments.length, 0)} meal{selectedRecipes.reduce((total, sr) => total + sr.assignments.length, 0) !== 1 ? 's' : ''} assigned
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentStep('recipe-selection');
                            setShowRecipeSelection(true);
                          }}
                        >
                          Edit Selection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Focus Goals</Label>
                  <p className="text-sm text-gray-500 mb-2">Select goals to help AI generate better meal suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {goalOptions.map(goal => (
                      <Badge
                        key={goal}
                        variant={formData.goals.includes(goal) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => toggleGoal(goal)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={generateMealPlanMutation.isPending}
                  >
                    {generateMealPlanMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
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
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe Selection Modal */}
      <RecipeSelectionModal
        isOpen={showRecipeSelection}
        onClose={() => {
          setShowRecipeSelection(false);
          setCurrentStep('form');
        }}
        onSelectRecipes={handleRecipeSelection}
        mealPlanDuration={formData.duration}
        selectedMealTypes={formData.mealTypes}
        startDate={formData.startDate}
      />
    </>
  );
}