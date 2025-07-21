import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Users, ChefHat, Plus, X, Copy, AlertTriangle, CheckCircle } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { format, addDays } from "date-fns";

interface SelectedRecipe {
  recipeId: number;
  recipe: Recipe;
  assignments: Array<{
    date: string;
    mealType: string;
    servings: number;
  }>;
}

interface RecipeAssignmentGridProps {
  selectedRecipes: SelectedRecipe[];
  mealPlanDuration: number;
  selectedMealTypes: string[];
  startDate: Date;
  onUpdateAssignments: (updatedRecipes: SelectedRecipe[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface AssignmentSlot {
  date: string;
  mealType: string;
  recipe?: Recipe;
  servings?: number;
}

export default function RecipeAssignmentGrid({
  selectedRecipes,
  mealPlanDuration,
  selectedMealTypes,
  startDate,
  onUpdateAssignments,
  onBack,
  onContinue
}: RecipeAssignmentGridProps) {
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, mealType: string} | null>(null);
  const [selectedRecipeForAssignment, setSelectedRecipeForAssignment] = useState<Recipe | null>(null);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [selectedRecipeForBulk, setSelectedRecipeForBulk] = useState<Recipe | null>(null);

  // Generate date range
  const dates = Array.from({ length: mealPlanDuration }, (_, i) => 
    addDays(startDate, i)
  );

  // Create assignment grid
  const getAssignmentGrid = (): Map<string, AssignmentSlot> => {
    const grid = new Map<string, AssignmentSlot>();
    
    // Initialize empty slots
    dates.forEach(date => {
      selectedMealTypes.forEach(mealType => {
        const key = `${format(date, 'yyyy-MM-dd')}-${mealType}`;
        grid.set(key, {
          date: format(date, 'yyyy-MM-dd'),
          mealType
        });
      });
    });

    // Fill with assigned recipes
    selectedRecipes.forEach(selectedRecipe => {
      selectedRecipe.assignments.forEach(assignment => {
        const key = `${assignment.date}-${assignment.mealType}`;
        grid.set(key, {
          date: assignment.date,
          mealType: assignment.mealType,
          recipe: selectedRecipe.recipe,
          servings: assignment.servings
        });
      });
    });

    return grid;
  };

  const assignmentGrid = getAssignmentGrid();

  const handleSlotClick = (date: string, mealType: string) => {
    setSelectedSlot({ date, mealType });
    setAssignmentModalOpen(true);
  };

  const handleAssignRecipe = (recipe: Recipe, servings: number) => {
    const updatedRecipes = selectedRecipes.map(selectedRecipe => {
      if (selectedRecipe.recipeId === recipe.id) {
        // Remove any existing assignment for this slot
        const filteredAssignments = selectedRecipe.assignments.filter(
          a => !(a.date === selectedSlot?.date && a.mealType === selectedSlot?.mealType)
        );
        
        // Add new assignment
        return {
          ...selectedRecipe,
          assignments: [
            ...filteredAssignments,
            {
              date: selectedSlot!.date,
              mealType: selectedSlot!.mealType,
              servings
            }
          ]
        };
      }
      return selectedRecipe;
    });

    onUpdateAssignments(updatedRecipes);
    setAssignmentModalOpen(false);
    setSelectedSlot(null);
  };

  const handleRemoveAssignment = (date: string, mealType: string) => {
    const updatedRecipes = selectedRecipes.map(selectedRecipe => ({
      ...selectedRecipe,
      assignments: selectedRecipe.assignments.filter(
        a => !(a.date === date && a.mealType === mealType)
      )
    }));

    onUpdateAssignments(updatedRecipes);
  };

  const getMealTypeLabel = (mealType: string) => {
    const labels: Record<string, string> = {
      breakfast: "Breakfast",
      lunch: "Lunch", 
      dinner: "Dinner",
      snack: "Snacks"
    };
    return labels[mealType] || mealType;
  };

  const getTotalAssignments = () => {
    return selectedRecipes.reduce((total, recipe) => total + recipe.assignments.length, 0);
  };

  const getTotalSlots = () => {
    return dates.length * selectedMealTypes.length;
  };

  // Bulk assign recipe to multiple slots
  const bulkAssignRecipe = (recipe: Recipe, mealType: string, servings: number = 4) => {
    const updatedRecipes = selectedRecipes.map(selectedRecipe => {
      if (selectedRecipe.recipeId === recipe.id) {
        // Add assignments for all dates with this meal type
        const newAssignments = dates.map(date => ({
          date: format(date, 'yyyy-MM-dd'),
          mealType,
          servings
        }));
        return {
          ...selectedRecipe,
          assignments: [...selectedRecipe.assignments, ...newAssignments]
        };
      }
      return selectedRecipe;
    });
    
    onUpdateAssignments(updatedRecipes);
    setBulkAssignMode(false);
    setSelectedRecipeForBulk(null);
  };

  // Get completion status
  const getCompletionStatus = () => {
    const assigned = getTotalAssignments();
    const total = getTotalSlots();
    const percentage = total > 0 ? (assigned / total) * 100 : 0;
    return { assigned, total, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assign Recipes to Meal Plan</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose when to use each selected recipe during your meal plan
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {getTotalAssignments()} of {getTotalSlots()} meals assigned
          </div>
          <div className="text-xs text-gray-400">
            {selectedRecipes.length} recipes selected
          </div>
        </div>
      </div>

      {/* Bulk Assignment Controls */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Copy className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Bulk Assignment</h4>
                <p className="text-sm text-blue-700">Assign one recipe to all days for a specific meal type</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setBulkAssignMode(!bulkAssignMode)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {bulkAssignMode ? 'Cancel' : 'Bulk Assign'}
            </Button>
          </div>
          
          {bulkAssignMode && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select onValueChange={(value) => {
                  const recipe = selectedRecipes.find(r => r.recipeId.toString() === value)?.recipe;
                  setSelectedRecipeForBulk(recipe || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRecipes.map(sr => (
                      <SelectItem key={sr.recipeId} value={sr.recipeId.toString()}>
                        {sr.recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select onValueChange={(mealType) => {
                  if (selectedRecipeForBulk && mealType) {
                    bulkAssignRecipe(selectedRecipeForBulk, mealType);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMealTypes.map(mealType => (
                      <SelectItem key={mealType} value={mealType}>
                        {getMealTypeLabel(mealType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  disabled={!selectedRecipeForBulk}
                  onClick={() => selectedRecipeForBulk && bulkAssignRecipe(selectedRecipeForBulk, selectedMealTypes[0])}
                >
                  Assign All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress and Validation */}
      {(() => {
        const { assigned, total, percentage } = getCompletionStatus();
        return (
          <TooltipProvider>
            <Alert className={percentage === 100 ? "border-green-200 bg-green-50" : percentage > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200"}>
              <div className="flex items-center space-x-2">
                {percentage === 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <AlertDescription className="flex-1">
                  {percentage === 100 ? (
                    <span className="text-green-800">All meal slots assigned! Ready to generate your meal plan.</span>
                  ) : percentage > 0 ? (
                    <span className="text-amber-800">
                      {assigned} of {total} meals assigned ({percentage.toFixed(0)}%). 
                      AI will generate recipes for remaining {total - assigned} slots.
                    </span>
                  ) : (
                    <span className="text-gray-700">
                      No meals assigned yet. AI will generate all {total} recipes, or start assigning your own recipes above.
                    </span>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          </TooltipProvider>
        );
      })()}

      {/* Selected Recipes Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Selected Recipes ({selectedRecipes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedRecipes.map(selectedRecipe => {
              const assignmentCount = selectedRecipe.assignments.length;
              return (
                <div 
                  key={selectedRecipe.recipeId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{selectedRecipe.recipe.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{selectedRecipe.recipe.servings}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{(selectedRecipe.recipe.prepTime || 0) + (selectedRecipe.recipe.cookTime || 0)}m</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={assignmentCount > 0 ? "default" : "secondary"}>
                    {assignmentCount} assigned
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meal Plan Grid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header Row */}
              <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `120px repeat(${dates.length}, 1fr)` }}>
                <div className="font-medium text-sm text-gray-500">Meal Type</div>
                {dates.map(date => (
                  <div key={date.toISOString()} className="text-center">
                    <div className="font-medium text-sm">{format(date, 'EEE')}</div>
                    <div className="text-xs text-gray-500">{format(date, 'MMM d')}</div>
                  </div>
                ))}
              </div>

              {/* Meal Type Rows */}
              {selectedMealTypes.map(mealType => (
                <div 
                  key={mealType} 
                  className="grid gap-2 mb-3" 
                  style={{ gridTemplateColumns: `120px repeat(${dates.length}, 1fr)` }}
                >
                  <div className="font-medium text-sm py-2">
                    {getMealTypeLabel(mealType)}
                  </div>
                  {dates.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const slot = assignmentGrid.get(`${dateStr}-${mealType}`);
                    
                    return (
                      <div key={`${dateStr}-${mealType}`} className="min-h-[80px]">
                        {slot?.recipe ? (
                          <Card 
                            className="h-full cursor-pointer hover:shadow-md transition-shadow bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                            onClick={() => handleSlotClick(dateStr, mealType)}
                          >
                            <CardContent className="p-2">
                              <div className="space-y-1">
                                <h5 className="font-medium text-xs leading-tight line-clamp-2">
                                  {slot.recipe.name}
                                </h5>
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="text-xs">
                                    {slot.servings} servings
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveAssignment(dateStr, mealType);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card 
                            className="h-full cursor-pointer hover:shadow-md transition-shadow border-dashed"
                            onClick={() => handleSlotClick(dateStr, mealType)}
                          >
                            <CardContent className="p-2 flex items-center justify-center">
                              <div className="text-center">
                                <Plus className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Add Recipe</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Recipe Selection
        </Button>
        <Button onClick={onContinue}>
          Continue to Generate Meal Plan
        </Button>
      </div>

      {/* Assignment Modal */}
      <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Recipe for {selectedSlot && format(new Date(selectedSlot.date), 'EEEE, MMMM d')} - {selectedSlot && getMealTypeLabel(selectedSlot.mealType)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Assignment */}
            {selectedSlot && assignmentGrid.get(`${selectedSlot.date}-${selectedSlot.mealType}`)?.recipe && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-sm font-medium mb-1">Currently Assigned:</div>
                <div className="text-sm">
                  {assignmentGrid.get(`${selectedSlot.date}-${selectedSlot.mealType}`)?.recipe?.name}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => selectedSlot && handleRemoveAssignment(selectedSlot.date, selectedSlot.mealType)}
                >
                  Remove Assignment
                </Button>
              </div>
            )}

            {/* Recipe Selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Select a recipe:</div>
              {selectedRecipes.map(selectedRecipe => (
                <Card 
                  key={selectedRecipe.recipeId}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedRecipeForAssignment(selectedRecipe.recipe)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{selectedRecipe.recipe.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{selectedRecipe.recipe.servings} servings</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{(selectedRecipe.recipe.prepTime || 0) + (selectedRecipe.recipe.cookTime || 0)}m</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {selectedRecipe.assignments.length} assigned
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Servings Selection */}
            {selectedRecipeForAssignment && (
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="text-sm font-medium">
                  Servings for {selectedRecipeForAssignment.name}
                </div>
                <Select 
                  defaultValue={selectedRecipeForAssignment.servings.toString()}
                  onValueChange={(value) => handleAssignRecipe(selectedRecipeForAssignment, parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} serving{num !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}