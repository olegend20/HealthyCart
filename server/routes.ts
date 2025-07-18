import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated as replitIsAuthenticated } from "./replitAuth";
import { isAuthenticated } from "./authMiddleware";
import { authService } from "./auth";
import { generateCompleteMealPlan, type MealPlanGenerationRequest } from "./services/mealPlanGeneratorFixed";
import { generateMultiMealPlan, type MultiMealPlanRequest } from "./services/multiMealPlanGenerator";
import { generateEnhancedMultiMealPlan, type MultiMealPlanRequest as EnhancedMultiMealPlanRequest } from "./services/enhancedMultiMealPlanGenerator";
import { generateCustomizedRecipe, type RecipeCustomizationRequest } from "./services/recipeCustomizer";
import { replaceRecipeWithAI, type RecipeReplacementRequest } from "./services/recipeReplacement";
import { 
  getConsolidatedIngredientsForMealPlan,
  getConsolidatedIngredientsForGroup,
  organizeIngredientsByStore,
  generateInstacartFormat,
  type StoreOrganizationRequest,
  type InstacartFormatRequest
} from "./services/consolidatedIngredientsService";
import { 
  insertHouseholdMemberSchema, 
  insertCookingEquipmentSchema, 
  insertMealPlanSchema,
  insertNutritionGoalSchema,
  registerSchema,
  loginSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/password authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const user = await authService.register(req.body);
      
      // Set session
      (req.session as any).userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Registration failed" 
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const user = await authService.login(req.body);
      
      // Set session
      (req.session as any).userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Login failed" 
      });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).json({ message: "Logout failed" });
          }
          res.clearCookie('connect.sid');
          res.json({ message: "Logged out successfully" });
        });
      } else {
        res.json({ message: "No active session" });
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      await authService.changePassword(userId, currentPassword, newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Password change failed" 
      });
    }
  });

  // Household member routes
  app.get('/api/household-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const members = await storage.getHouseholdMembers(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching household members:", error);
      res.status(500).json({ message: "Failed to fetch household members" });
    }
  });

  app.post('/api/household-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const memberData = insertHouseholdMemberSchema.parse({
        ...req.body,
        userId
      });
      
      const member = await storage.createHouseholdMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Error creating household member:", error);
      res.status(400).json({ message: "Failed to create household member" });
    }
  });

  app.put('/api/household-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const member = await storage.updateHouseholdMember(id, updates);
      res.json(member);
    } catch (error) {
      console.error("Error updating household member:", error);
      res.status(400).json({ message: "Failed to update household member" });
    }
  });

  app.delete('/api/household-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHouseholdMember(id);
      res.json({ message: "Household member deleted successfully" });
    } catch (error) {
      console.error("Error deleting household member:", error);
      res.status(500).json({ message: "Failed to delete household member" });
    }
  });

  // Cooking equipment routes
  app.get('/api/cooking-equipment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const equipment = await storage.getCookingEquipment(userId);
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching cooking equipment:", error);
      res.status(500).json({ message: "Failed to fetch cooking equipment" });
    }
  });

  app.post('/api/cooking-equipment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const equipmentData = insertCookingEquipmentSchema.parse({
        ...req.body,
        userId
      });
      
      const equipment = await storage.createCookingEquipment(equipmentData);
      res.json(equipment);
    } catch (error) {
      console.error("Error creating cooking equipment:", error);
      res.status(400).json({ message: "Failed to create cooking equipment" });
    }
  });

  app.delete('/api/cooking-equipment/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCookingEquipment(id);
      res.json({ message: "Cooking equipment deleted successfully" });
    } catch (error) {
      console.error("Error deleting cooking equipment:", error);
      res.status(500).json({ message: "Failed to delete cooking equipment" });
    }
  });

  // Meal plan group routes  
  app.get('/api/meal-plan-groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const groups = await storage.getMealPlanGroups(userId);
      
      // Get associated meal plans for each group
      const groupsWithPlans = await Promise.all(
        groups.map(async (group) => {
          const mealPlans = await storage.getMealPlansByGroup(group.id);
          return { ...group, mealPlans };
        })
      );
      
      res.json(groupsWithPlans);
    } catch (error) {
      console.error("Error fetching meal plan groups:", error);
      res.status(500).json({ message: "Failed to fetch meal plan groups" });
    }
  });

  app.get('/api/meal-plan-groups/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const group = await storage.getMealPlanGroup(groupId);
      
      if (!group) {
        return res.status(404).json({ message: "Meal plan group not found" });
      }
      
      const mealPlans = await storage.getMealPlansByGroup(groupId);
      res.json({ ...group, mealPlans });
    } catch (error) {
      console.error("Error fetching meal plan group:", error);
      res.status(500).json({ message: "Failed to fetch meal plan group" });
    }
  });

  app.get('/api/meal-plan-groups/:groupId/consolidated-grocery-list', isAuthenticated, async (req: any, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const mealPlans = await storage.getMealPlansByGroup(groupId);
      
      // Get all grocery lists for the meal plans in this group
      const allGroceryLists = [];
      for (const plan of mealPlans) {
        const groceryLists = await storage.getGroceryLists(plan.id);
        for (const list of groceryLists) {
          const detailedList = await storage.getGroceryList(list.id);
          if (detailedList) {
            allGroceryLists.push(detailedList);
          }
        }
      }
      
      // Consolidate items by name and category
      const consolidatedItems = new Map();
      let totalCost = 0;
      
      for (const list of allGroceryLists) {
        for (const item of list.items) {
          const key = `${item.name}-${item.category}`;
          const itemPrice = parseFloat(item.estimatedPrice) || 0;
          
          if (consolidatedItems.has(key)) {
            const existing = consolidatedItems.get(key);
            existing.amount += item.amount;
            existing.estimatedPrice += itemPrice;
          } else {
            consolidatedItems.set(key, { ...item, estimatedPrice: itemPrice });
          }
          totalCost += itemPrice;
        }
      }
      
      // Ensure totalCost is a number
      const finalTotalCost = typeof totalCost === 'number' ? totalCost : 0;
      
      const consolidatedGroceryList = {
        id: `consolidated-${groupId}`,
        name: `Consolidated Grocery List`,
        totalCost: finalTotalCost.toFixed(2),
        items: Array.from(consolidatedItems.values())
      };
      
      res.json(consolidatedGroceryList);
    } catch (error) {
      console.error("Error creating consolidated grocery list:", error);
      res.status(500).json({ message: "Failed to create consolidated grocery list" });
    }
  });

  // Meal plan routes
  app.get('/api/meal-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const mealPlans = await storage.getMealPlans(userId);
      res.json(mealPlans);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  app.get('/api/meal-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const id = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlan(id, userId);
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      res.json(mealPlan);
    } catch (error) {
      console.error("Error fetching meal plan:", error);
      res.status(500).json({ message: "Failed to fetch meal plan" });
    }
  });

  app.get('/api/meals/:mealPlanId', isAuthenticated, async (req: any, res) => {
    try {
      const mealPlanId = parseInt(req.params.mealPlanId);
      const meals = await storage.getMeals(mealPlanId);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.get('/api/recipes/:id/ingredients', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const ingredients = await storage.getRecipeIngredients(id);
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching recipe ingredients:", error);
      res.status(500).json({ message: "Failed to fetch recipe ingredients" });
    }
  });

  // Recipe management routes
  app.get('/api/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const userId = req.user.claims?.sub || req.user.id;
      
      const recipes = await storage.getUserRecipes(userId, limit, offset);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get('/api/recipes/search', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string || '';
      const tags = req.query.tags ? (req.query.tags as string).split(',') : [];
      const userId = req.user.claims?.sub || req.user.id;
      
      const recipes = await storage.searchUserRecipes(userId, query, tags);
      res.json(recipes);
    } catch (error) {
      console.error("Error searching recipes:", error);
      res.status(500).json({ message: "Failed to search recipes" });
    }
  });

  app.get('/api/recipes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Route to add a recipe to user's library
  app.post('/api/recipes/:id/add', isAuthenticated, async (req: any, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const userId = req.user.claims?.sub || req.user.id;
      
      if (isNaN(recipeId)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      
      await storage.addRecipeToUser(userId, recipeId);
      res.json({ message: "Recipe added to library" });
    } catch (error) {
      console.error("Error adding recipe to user library:", error);
      res.status(500).json({ message: "Failed to add recipe to library" });
    }
  });

  app.post('/api/recipes/:id/customize', isAuthenticated, async (req: any, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const { originalRecipe, ingredients, modifications, servingMultiplier } = req.body;
      
      // Generate customized recipe using OpenAI
      const customizedRecipe = await generateCustomizedRecipe({
        originalRecipe,
        ingredients,
        modifications,
        servingMultiplier
      });
      
      res.json(customizedRecipe);
    } catch (error) {
      console.error("Error customizing recipe:", error);
      res.status(500).json({ message: "Failed to customize recipe" });
    }
  });

  app.post('/api/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const recipeData = req.body;
      const newRecipe = await storage.createRecipe(recipeData);
      
      // Create ingredients
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        for (const ingredient of recipeData.ingredients) {
          await storage.createRecipeIngredient({
            recipeId: newRecipe.id,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            category: ingredient.category,
            optional: ingredient.optional || false
          });
        }
      }
      
      res.json(newRecipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  app.get('/api/grocery-lists/meal-plan/:mealPlanId', isAuthenticated, async (req: any, res) => {
    try {
      const mealPlanId = parseInt(req.params.mealPlanId);
      const groceryLists = await storage.getGroceryLists(mealPlanId);
      
      // Get detailed grocery lists with items
      const detailedGroceryLists = await Promise.all(
        groceryLists.map(async (list) => {
          const detailedList = await storage.getGroceryList(list.id);
          return detailedList;
        })
      );
      
      res.json(detailedGroceryLists.filter(Boolean));
    } catch (error) {
      console.error("Error fetching grocery lists:", error);
      res.status(500).json({ message: "Failed to fetch grocery lists" });
    }
  });

  app.get('/api/meal-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const id = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlan(id, userId);
      
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }

      // Get meals for this meal plan
      const meals = await storage.getMeals(id);
      
      res.json({ ...mealPlan, meals });
    } catch (error) {
      console.error("Error fetching meal plan:", error);
      res.status(500).json({ message: "Failed to fetch meal plan" });
    }
  });

  app.post('/api/meal-plans/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { name, duration, budget, goals, mealTypes, startDate, selectedMembers } = req.body;
      
      const request: MealPlanGenerationRequest = {
        userId,
        name,
        duration,
        budget,
        goals,
        mealTypes,
        startDate: new Date(startDate)
      };

      const generatedPlan = await generateCompleteMealPlan(request);
      
      // Add selected members to the meal plan
      if (selectedMembers && selectedMembers.length > 0) {
        await storage.addMealPlanMembers(generatedPlan.mealPlan.id, selectedMembers);
      }
      
      res.json(generatedPlan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate meal plan" 
      });
    }
  });

  app.post('/api/meal-plans/generate-multi', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { groupName, mealPlans } = req.body;
      
      console.log("Received enhanced multi-meal plan generation request:", { groupName, mealPlansCount: mealPlans.length });
      
      const request: EnhancedMultiMealPlanRequest = {
        userId,
        groupName: groupName || "Multi-Target Meal Planning",
        mealPlans: mealPlans.map((plan: any) => ({
          name: plan.name,
          targetGroup: plan.targetGroup,
          selectedMembers: plan.selectedMembers,
          goals: plan.goals,
          mealTypes: plan.mealTypes,
          duration: plan.duration,
          mealCount: plan.mealCount || 5, // Default to 5 meals if not specified
          budget: plan.budget,
          startDate: new Date(plan.startDate)
        }))
      };

      const generatedMultiPlan = await generateEnhancedMultiMealPlan(request);
      
      res.json(generatedMultiPlan);
    } catch (error) {
      console.error("Error generating enhanced multi-meal plan:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate enhanced multi-meal plan" 
      });
    }
  });

  // Get meal plan members
  app.get('/api/meal-plans/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const mealPlanId = parseInt(req.params.id);
      
      // Verify user owns this meal plan
      const mealPlan = await storage.getMealPlan(mealPlanId, userId);
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      const members = await storage.getMealPlanMembers(mealPlanId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching meal plan members:", error);
      res.status(500).json({ message: "Failed to fetch meal plan members" });
    }
  });

  app.put('/api/meal-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const mealPlan = await storage.updateMealPlan(id, updates);
      res.json(mealPlan);
    } catch (error) {
      console.error("Error updating meal plan:", error);
      res.status(400).json({ message: "Failed to update meal plan" });
    }
  });

  app.delete('/api/meal-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMealPlan(id);
      res.json({ message: "Meal plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      res.status(500).json({ message: "Failed to delete meal plan" });
    }
  });

  // Meal routes
  app.put('/api/meals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const meal = await storage.updateMeal(id, updates);
      res.json(meal);
    } catch (error) {
      console.error("Error updating meal:", error);
      res.status(400).json({ message: "Failed to update meal" });
    }
  });

  app.delete('/api/meals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMeal(id);
      res.json({ message: "Meal deleted successfully" });
    } catch (error) {
      console.error("Error deleting meal:", error);
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });

  // Grocery list routes
  app.get('/api/grocery-lists/meal-plan/:mealPlanId', isAuthenticated, async (req: any, res) => {
    try {
      const mealPlanId = parseInt(req.params.mealPlanId);
      if (isNaN(mealPlanId)) {
        return res.status(400).json({ message: "Invalid meal plan ID" });
      }
      const groceryLists = await storage.getGroceryLists(mealPlanId);
      res.json(groceryLists);
    } catch (error) {
      console.error("Error fetching grocery lists:", error);
      res.status(500).json({ message: "Failed to fetch grocery lists" });
    }
  });

  app.get('/api/grocery-lists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid grocery list ID" });
      }
      
      const groceryList = await storage.getGroceryList(id);
      
      if (!groceryList) {
        return res.status(404).json({ message: "Grocery list not found" });
      }

      res.json(groceryList);
    } catch (error) {
      console.error("Error fetching grocery list:", error);
      res.status(500).json({ message: "Failed to fetch grocery list" });
    }
  });

  // Recipe replacement route
  app.post('/api/meals/:mealId/replace-recipe', isAuthenticated, async (req: any, res) => {
    try {
      const mealId = parseInt(req.params.mealId);
      const userId = req.user.claims?.sub || req.user.id;
      
      if (isNaN(mealId)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const request: RecipeReplacementRequest = {
        userId,
        mealId,
        currentRecipeId: req.body.currentRecipeId,
        mealPlanId: req.body.mealPlanId,
        mealType: req.body.mealType,
        servings: req.body.servings,
        rejectionReason: req.body.rejectionReason
      };

      const result = await replaceRecipeWithAI(request);
      res.json(result);
    } catch (error) {
      console.error("Error replacing recipe:", error);
      res.status(500).json({ message: "Failed to replace recipe" });
    }
  });

  // Recipe routes
  app.get('/api/recipes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      
      const recipe = await storage.getRecipeWithIngredients(id);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Meal routes
  app.get('/api/meals/:mealPlanId', isAuthenticated, async (req: any, res) => {
    try {
      const mealPlanId = parseInt(req.params.mealPlanId);
      if (isNaN(mealPlanId)) {
        return res.status(400).json({ message: "Invalid meal plan ID" });
      }
      
      const meals = await storage.getMeals(mealPlanId);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.put('/api/grocery-list-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateGroceryListItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating grocery list item:", error);
      res.status(400).json({ message: "Failed to update grocery list item" });
    }
  });

  // Nutrition goals routes
  app.get('/api/nutrition-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const goals = await storage.getNutritionGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching nutrition goals:", error);
      res.status(500).json({ message: "Failed to fetch nutrition goals" });
    }
  });

  app.post('/api/nutrition-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const goalData = insertNutritionGoalSchema.parse({
        ...req.body,
        userId
      });
      
      const goal = await storage.createNutritionGoal(goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating nutrition goal:", error);
      res.status(400).json({ message: "Failed to create nutrition goal" });
    }
  });

  app.put('/api/nutrition-goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const goal = await storage.updateNutritionGoal(id, updates);
      res.json(goal);
    } catch (error) {
      console.error("Error updating nutrition goal:", error);
      res.status(400).json({ message: "Failed to update nutrition goal" });
    }
  });

  app.delete('/api/nutrition-goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNutritionGoal(id);
      res.json({ message: "Nutrition goal deleted successfully" });
    } catch (error) {
      console.error("Error deleting nutrition goal:", error);
      res.status(500).json({ message: "Failed to delete nutrition goal" });
    }
  });

  // Consolidated ingredients routes
  app.get('/api/consolidated-ingredients/meal-plan/:mealPlanId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const mealPlanId = parseInt(req.params.mealPlanId);
      
      if (isNaN(mealPlanId)) {
        return res.status(400).json({ message: "Invalid meal plan ID" });
      }

      const consolidatedIngredients = await getConsolidatedIngredientsForMealPlan(mealPlanId, userId);
      res.json(consolidatedIngredients);
    } catch (error) {
      console.error("Error getting consolidated ingredients for meal plan:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get consolidated ingredients" 
      });
    }
  });

  app.get('/api/consolidated-ingredients/group/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const groupId = parseInt(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }

      const consolidatedIngredients = await getConsolidatedIngredientsForGroup(groupId, userId);
      res.json(consolidatedIngredients);
    } catch (error) {
      console.error("Error getting consolidated ingredients for group:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get consolidated ingredients" 
      });
    }
  });

  app.post('/api/consolidated-ingredients/organize-by-store', isAuthenticated, async (req: any, res) => {
    try {
      const request: StoreOrganizationRequest = req.body;
      
      if (!request.ingredients || !request.store) {
        return res.status(400).json({ message: "Missing ingredients or store information" });
      }

      const organizedIngredients = await organizeIngredientsByStore(request);
      res.json(organizedIngredients);
    } catch (error) {
      console.error("Error organizing ingredients by store:", error);
      res.status(500).json({ message: "Failed to organize ingredients by store" });
    }
  });

  app.post('/api/consolidated-ingredients/instacart-format', isAuthenticated, async (req: any, res) => {
    try {
      const request: InstacartFormatRequest = req.body;
      
      if (!request.ingredients) {
        return res.status(400).json({ message: "Missing ingredients information" });
      }

      const instacartFormat = await generateInstacartFormat(request);
      res.json({ format: instacartFormat });
    } catch (error) {
      console.error("Error generating Instacart format:", error);
      res.status(500).json({ message: "Failed to generate Instacart format" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
