import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Clock, Users, ChefHat, X, Filter, Star } from "lucide-react";
import { Recipe } from "@/types/recipe";

interface SelectedRecipe {
  recipeId: number;
  recipe: Recipe;
  assignments: Array<{
    date: string; // ISO date string
    mealType: string;
    servings: number;
  }>;
}

interface RecipeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipes: (selectedRecipes: SelectedRecipe[]) => void;
  mealPlanDuration: number;
  selectedMealTypes: string[];
  startDate: Date;
}

export default function RecipeSelectionModal({
  isOpen,
  onClose,
  onSelectRecipes,
  mealPlanDuration,
  selectedMealTypes,
  startDate
}: RecipeSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedRecipes, setSelectedRecipes] = useState<Map<number, SelectedRecipe>>(new Map());

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes/search", searchQuery, selectedCuisine, selectedDifficulty],
    enabled: isOpen,
  });

  // Filter and sort recipes with advanced logic
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.cuisine?.toLowerCase().includes(query)
      );
    }
    
    // Apply cuisine filter
    if (selectedCuisine) {
      filtered = filtered.filter(recipe => recipe.cuisine === selectedCuisine);
    }
    
    // Apply difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty);
    }
    
    // Sort by relevance and popularity
    return filtered.sort((a, b) => {
      // Prioritize recently added recipes
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [recipes, searchQuery, selectedCuisine, selectedDifficulty]);

  const cuisineOptions = [
    "Italian", "Mexican", "Asian", "Mediterranean", "American", 
    "Indian", "Thai", "French", "Greek", "Chinese"
  ];

  const difficultyOptions = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" }
  ];

  const handleRecipeSelect = (recipe: Recipe) => {
    const newSelected = new Map(selectedRecipes);
    if (newSelected.has(recipe.id)) {
      newSelected.delete(recipe.id);
    } else {
      newSelected.set(recipe.id, {
        recipeId: recipe.id,
        recipe,
        assignments: []
      });
    }
    setSelectedRecipes(newSelected);
  };

  const handleConfirmSelection = () => {
    onSelectRecipes(Array.from(selectedRecipes.values()));
    onClose();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCuisine("");
    setSelectedDifficulty("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Select Recipes from Your Library
          </DialogTitle>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search recipes by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Cuisines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cuisines</SelectItem>
                {cuisineOptions.map(cuisine => (
                  <SelectItem key={cuisine} value={cuisine.toLowerCase()}>
                    {cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Difficulties</SelectItem>
                {difficultyOptions.map(difficulty => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || selectedCuisine || selectedDifficulty) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {selectedRecipes.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <span className="text-sm font-medium">
                {selectedRecipes.size} recipe{selectedRecipes.size !== 1 ? 's' : ''} selected
              </span>
              <Button onClick={handleConfirmSelection} size="sm">
                Continue with Selected Recipes
              </Button>
            </div>
          )}
        </div>

        {/* Recipe Grid */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery || selectedCuisine || selectedDifficulty 
                  ? "No recipes match your filters" 
                  : "No recipes in your library yet"
                }
              </p>
              {!searchQuery && !selectedCuisine && !selectedDifficulty && (
                <p className="text-sm text-gray-400">
                  Add recipes to your library to use them in meal plans
                </p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {recipes.map((recipe: Recipe) => {
                const isSelected = selectedRecipes.has(recipe.id);
                return (
                  <Card 
                    key={recipe.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                    }`}
                    onClick={() => handleRecipeSelect(recipe)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium line-clamp-2">{recipe.name}</h3>
                          {recipe.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {recipe.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{(recipe.prepTime || 0) + (recipe.cookTime || 0)}m</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{recipe.servings}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {recipe.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {recipe.difficulty}
                            </Badge>
                          )}
                          {recipe.cuisine && (
                            <Badge variant="outline" className="text-xs">
                              {recipe.cuisine}
                            </Badge>
                          )}
                          {recipe.tags && recipe.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {isSelected && (
                          <div className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 rounded">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Selected
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {selectedRecipes.size > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedRecipes(new Map())}
              >
                Clear Selection
              </Button>
            )}
            <Button 
              onClick={handleConfirmSelection}
              disabled={selectedRecipes.size === 0}
            >
              Continue with {selectedRecipes.size} Recipe{selectedRecipes.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}