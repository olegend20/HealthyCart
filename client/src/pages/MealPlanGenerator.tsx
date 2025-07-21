import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, CalendarIcon, Bot, Utensils, Users, DollarSign, Target, ChefHat } from "lucide-react";
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

export default function MealPlanGenerator() {
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
    enabled: !!user,
  });

  const { data: cookingEquipment = [], isLoading: equipmentLoading } = useQuery<any[]>({
    queryKey: ["/api/cooking-equipment"],
    enabled: !!user,
  });

  const { data: userRecipes = [], isLoading: recipesLoading } = useQuery<any[]>({
    queryKey: ["/api/recipes"],
    enabled: !!user && includeExistingRecipes,
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
      // Could redirect to the new meal plan or home
      window.history.back();
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

  if (membersLoading || equipmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center">
                <Bot className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-bold text-gray-900">AI Meal Plan Generator</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Perfect Meal Plan</h2>
          <p className="text-gray-600">
            Our AI will generate a personalized meal plan based on your household preferences, 
            dietary restrictions, and cooking equipment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="h-5 w-5" />
                  <span>Meal Plan Details</span>
                </CardTitle>
                <CardDescription>
                  Configure your meal plan preferences
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

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                    disabled={generateMealPlanMutation.isPending}
                  >
                    {generateMealPlanMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating Your Meal Plan...
                      </>
                    ) : (
                      <>
                        <Bot className="h-5 w-5 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Household Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Household</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {householdMembers && householdMembers.length > 0 ? (
                  <div className="space-y-3">
                    {householdMembers.map((member: any) => (
                      <div key={member.id} className="text-sm">
                        <div className="font-medium">{member.name}</div>
                        {member.age && (
                          <div className="text-gray-500">{member.age} years old</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-2">No household members</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/household-setup">Add Members</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dietary Information */}
            {(restrictions.length > 0 || allergies.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Dietary Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {restrictions.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Restrictions</div>
                      <div className="flex flex-wrap gap-1">
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
                      <div className="text-sm font-medium text-gray-700 mb-2">Allergies</div>
                      <div className="flex flex-wrap gap-1">
                        {allergies.map(allergy => (
                          <Badge key={allergy} variant="destructive" className="text-xs">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Equipment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Equipment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cookingEquipment && cookingEquipment.length > 0 ? (
                  <div className="space-y-2">
                    {cookingEquipment.slice(0, 4).map((equipment: any) => (
                      <div key={equipment.id} className="text-sm">
                        <div className="font-medium">{equipment.name}</div>
                        <div className="text-gray-500 capitalize">
                          {equipment.type.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                    {cookingEquipment.length > 4 && (
                      <div className="text-xs text-gray-500">
                        +{cookingEquipment.length - 4} more items
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-2">No equipment added</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/household-setup">Add Equipment</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recipe Assignment Grid */}
        {currentStep === 'recipe-assignment' && showRecipeAssignment && (
          <div className="mt-8">
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
      </main>

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
    </div>
  );
}
