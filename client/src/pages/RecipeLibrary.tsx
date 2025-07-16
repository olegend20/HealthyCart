import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "../lib/queryClient";

interface Recipe {
  id: number;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  tags: string[];
  rating: string;
  nutritionFacts: any;
  imageUrl?: string;
}

interface RecipeIngredient {
  id: number;
  name: string;
  amount: string;
  unit: string;
  category: string;
  optional: boolean;
}

export default function RecipeLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 12;

  const queryClient = useQueryClient();

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['/api/recipes', { page: currentPage, limit: recipesPerPage }],
    queryFn: async () => {
      const response = await fetch(`/api/recipes?page=${currentPage}&limit=${recipesPerPage}`);
      return response.json();
    }
  });

  const { data: recipeIngredients = [] } = useQuery({
    queryKey: ['/api/recipes', selectedRecipe?.id, 'ingredients'],
    queryFn: async () => {
      if (!selectedRecipe) return [];
      const response = await fetch(`/api/recipes/${selectedRecipe.id}/ingredients`);
      return response.json();
    },
    enabled: !!selectedRecipe && showIngredients
  });

  const searchRecipesMutation = useMutation({
    mutationFn: async (params: { query: string; tags?: string[] }) => {
      const searchParams = new URLSearchParams();
      if (params.query) searchParams.append('q', params.query);
      if (params.tags && params.tags.length > 0) {
        searchParams.append('tags', params.tags.join(','));
      }
      const response = await fetch(`/api/recipes/search?${searchParams}`);
      return response.json();
    }
  });

  const allTags = Array.from(new Set(recipes.flatMap((recipe: Recipe) => recipe.tags || [])));

  const filteredRecipes = searchRecipesMutation.data || recipes;

  const handleSearch = () => {
    if (searchQuery.trim() || selectedTags.length > 0) {
      searchRecipesMutation.mutate({
        query: searchQuery.trim(),
        tags: selectedTags
      });
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {recipe.imageUrl && (
        <img 
          src={recipe.imageUrl} 
          alt={recipe.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {recipe.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {recipe.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>🕒 {recipe.prepTime + recipe.cookTime} min</span>
          <span>👥 {recipe.servings} servings</span>
          <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(recipe.difficulty)}`}>
            {recipe.difficulty}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {recipe.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{recipe.tags.length - 3} more
            </span>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedRecipe(recipe);
              setShowIngredients(true);
            }}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
          >
            View Recipe
          </button>
          <Link
            to={`/recipe/${recipe.id}/customize`}
            className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 text-center"
          >
            Customize
          </Link>
        </div>
      </div>
    </div>
  );

  const RecipeModal = () => {
    if (!selectedRecipe) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedRecipe.name}
              </h2>
              <button
                onClick={() => {
                  setSelectedRecipe(null);
                  setShowIngredients(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {selectedRecipe.imageUrl && (
              <img 
                src={selectedRecipe.imageUrl} 
                alt={selectedRecipe.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}

            <p className="text-gray-600 mb-4">{selectedRecipe.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedRecipe.prepTime}
                </div>
                <div className="text-sm text-gray-500">Prep Time (min)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selectedRecipe.cookTime}
                </div>
                <div className="text-sm text-gray-500">Cook Time (min)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedRecipe.servings}
                </div>
                <div className="text-sm text-gray-500">Servings</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  selectedRecipe.difficulty === 'easy' ? 'text-green-600' :
                  selectedRecipe.difficulty === 'medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {selectedRecipe.difficulty}
                </div>
                <div className="text-sm text-gray-500">Difficulty</div>
              </div>
            </div>

            {recipeIngredients.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Ingredients
                </h3>
                <div className="space-y-2">
                  {recipeIngredients.map((ingredient: RecipeIngredient) => (
                    <div key={ingredient.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-900">
                        {ingredient.name}
                        {ingredient.optional && (
                          <span className="text-gray-500 text-sm ml-1">(optional)</span>
                        )}
                      </span>
                      <span className="text-gray-600 text-sm">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Link
                to={`/recipe/${selectedRecipe.id}/customize`}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 text-center font-medium"
              >
                Customize This Recipe
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + `/recipe/${selectedRecipe.id}`);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recipe Library</h1>
            <p className="text-gray-600 mt-1">
              Discover and customize recipes from your meal plans
            </p>
          </div>
          <Link
            to="/"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Home
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          {/* Tags Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by tags:</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe: Recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or create some meal plans to generate recipes
            </p>
            <Link
              to="/meal-plan-generator"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create Meal Plan
            </Link>
          </div>
        )}

        {/* Pagination */}
        {filteredRecipes.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={filteredRecipes.length < recipesPerPage}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedRecipe && <RecipeModal />}
    </div>
  );
}