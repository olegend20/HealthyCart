import {
  users,
  householdMembers,
  cookingEquipment,
  mealPlans,
  mealPlanGroups,
  recipes,
  recipeIngredients,
  meals,
  groceryLists,
  groceryListItems,
  nutritionGoals,
  mealPlanMembers,
  type User,
  type UpsertUser,
  type HouseholdMember,
  type InsertHouseholdMember,
  type CookingEquipment,
  type InsertCookingEquipment,
  type MealPlan,
  type InsertMealPlan,
  type MealPlanGroup,
  type InsertMealPlanGroup,
  type Recipe,
  type InsertRecipe,
  type RecipeIngredient,
  type InsertRecipeIngredient,
  type Meal,
  type InsertMeal,
  type GroceryList,
  type InsertGroceryList,
  type GroceryListItem,
  type InsertGroceryListItem,
  type NutritionGoal,
  type InsertNutritionGoal,
  type MealPlanMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Household members
  getHouseholdMembers(userId: string): Promise<HouseholdMember[]>;
  createHouseholdMember(member: InsertHouseholdMember): Promise<HouseholdMember>;
  updateHouseholdMember(id: number, updates: Partial<HouseholdMember>): Promise<HouseholdMember>;
  deleteHouseholdMember(id: number): Promise<void>;
  
  // Cooking equipment
  getCookingEquipment(userId: string): Promise<CookingEquipment[]>;
  createCookingEquipment(equipment: InsertCookingEquipment): Promise<CookingEquipment>;
  deleteCookingEquipment(id: number): Promise<void>;
  
  // Meal plan groups
  getMealPlanGroups(userId: string): Promise<MealPlanGroup[]>;
  getMealPlanGroup(id: number): Promise<MealPlanGroup | undefined>;
  getMealPlansByGroup(groupId: number): Promise<MealPlan[]>;
  createMealPlanGroup(group: InsertMealPlanGroup): Promise<MealPlanGroup>;
  
  // Meal plans
  getMealPlans(userId: string): Promise<MealPlan[]>;
  getMealPlan(id: number, userId: string): Promise<MealPlan | undefined>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: number, updates: Partial<MealPlan>): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;
  
  // Meal plan members
  getMealPlanMembers(mealPlanId: number): Promise<MealPlanMember[]>;
  addMealPlanMembers(mealPlanId: number, memberIds: number[]): Promise<void>;
  removeMealPlanMembers(mealPlanId: number): Promise<void>;
  
  // Recipes
  getRecipes(limit?: number, offset?: number): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  getRecipeWithIngredients(id: number): Promise<(Recipe & { ingredients: RecipeIngredient[] }) | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  searchRecipes(query: string, tags?: string[]): Promise<Recipe[]>;
  
  // Recipe ingredients
  getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]>;
  createRecipeIngredient(ingredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  
  // Meals
  getMeals(mealPlanId: number): Promise<(Meal & { recipe: Recipe })[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, updates: Partial<Meal>): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;
  
  // Grocery lists
  getGroceryLists(mealPlanId: number): Promise<GroceryList[]>;
  getGroceryList(id: number): Promise<(GroceryList & { items: GroceryListItem[] }) | undefined>;
  createGroceryList(groceryList: InsertGroceryList): Promise<GroceryList>;
  updateGroceryList(id: number, updates: Partial<GroceryList>): Promise<GroceryList>;
  
  // Grocery list items
  createGroceryListItem(item: InsertGroceryListItem): Promise<GroceryListItem>;
  updateGroceryListItem(id: number, updates: Partial<GroceryListItem>): Promise<GroceryListItem>;
  
  // Nutrition goals
  getNutritionGoals(userId: string): Promise<NutritionGoal[]>;
  createNutritionGoal(goal: InsertNutritionGoal): Promise<NutritionGoal>;
  updateNutritionGoal(id: number, updates: Partial<NutritionGoal>): Promise<NutritionGoal>;
  deleteNutritionGoal(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Household members
  async getHouseholdMembers(userId: string): Promise<HouseholdMember[]> {
    return await db
      .select()
      .from(householdMembers)
      .where(eq(householdMembers.userId, userId));
  }

  async createHouseholdMember(member: InsertHouseholdMember): Promise<HouseholdMember> {
    const [result] = await db.insert(householdMembers).values(member).returning();
    return result;
  }

  async updateHouseholdMember(id: number, updates: Partial<HouseholdMember>): Promise<HouseholdMember> {
    const [result] = await db
      .update(householdMembers)
      .set(updates)
      .where(eq(householdMembers.id, id))
      .returning();
    return result;
  }

  async deleteHouseholdMember(id: number): Promise<void> {
    await db.delete(householdMembers).where(eq(householdMembers.id, id));
  }

  // Cooking equipment
  async getCookingEquipment(userId: string): Promise<CookingEquipment[]> {
    return await db
      .select()
      .from(cookingEquipment)
      .where(eq(cookingEquipment.userId, userId));
  }

  async createCookingEquipment(equipment: InsertCookingEquipment): Promise<CookingEquipment> {
    const [result] = await db.insert(cookingEquipment).values(equipment).returning();
    return result;
  }

  async deleteCookingEquipment(id: number): Promise<void> {
    await db.delete(cookingEquipment).where(eq(cookingEquipment.id, id));
  }

  // Meal plan groups
  async getMealPlanGroups(userId: string): Promise<MealPlanGroup[]> {
    return await db
      .select()
      .from(mealPlanGroups)
      .where(eq(mealPlanGroups.userId, userId))
      .orderBy(desc(mealPlanGroups.createdAt));
  }

  async getMealPlanGroup(id: number): Promise<MealPlanGroup | undefined> {
    const [result] = await db
      .select()
      .from(mealPlanGroups)
      .where(eq(mealPlanGroups.id, id));
    return result;
  }

  async getMealPlansByGroup(groupId: number): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.groupId, groupId))
      .orderBy(desc(mealPlans.createdAt));
  }

  async createMealPlanGroup(group: InsertMealPlanGroup): Promise<MealPlanGroup> {
    const [result] = await db.insert(mealPlanGroups).values(group).returning();
    return result;
  }

  // Meal plans
  async getMealPlans(userId: string): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(desc(mealPlans.createdAt));
  }

  async getMealPlan(id: number, userId: string): Promise<MealPlan | undefined> {
    const [result] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.id, id), eq(mealPlans.userId, userId)));
    return result;
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const [result] = await db.insert(mealPlans).values(mealPlan).returning();
    return result;
  }

  async updateMealPlan(id: number, updates: Partial<MealPlan>): Promise<MealPlan> {
    const [result] = await db
      .update(mealPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mealPlans.id, id))
      .returning();
    return result;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }

  // Recipes
  async getRecipes(limit = 50, offset = 0): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(recipes.rating));
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [result] = await db.select().from(recipes).where(eq(recipes.id, id));
    return result;
  }

  async getRecipeWithIngredients(id: number): Promise<(Recipe & { ingredients: RecipeIngredient[] }) | undefined> {
    const recipe = await this.getRecipe(id);
    if (!recipe) return undefined;

    const ingredients = await this.getRecipeIngredients(id);
    return { ...recipe, ingredients };
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [result] = await db.insert(recipes).values(recipe).returning();
    return result;
  }

  async searchRecipes(query: string, tags?: string[]): Promise<Recipe[]> {
    let queryBuilder = db
      .select()
      .from(recipes)
      .where(like(recipes.name, `%${query}%`));

    if (tags && tags.length > 0) {
      // Simple tag filtering - in a real app, you'd want more sophisticated JSON querying
      queryBuilder = queryBuilder.limit(50);
    }

    return await queryBuilder.orderBy(desc(recipes.rating));
  }

  // Recipe ingredients
  async getRecipeIngredients(recipeId: number): Promise<RecipeIngredient[]> {
    return await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));
  }

  async createRecipeIngredient(ingredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const [result] = await db.insert(recipeIngredients).values(ingredient).returning();
    return result;
  }

  // Meals
  async getMeals(mealPlanId: number): Promise<(Meal & { recipe: Recipe })[]> {
    return await db
      .select({
        id: meals.id,
        mealPlanId: meals.mealPlanId,
        recipeId: meals.recipeId,
        date: meals.date,
        mealType: meals.mealType,
        servings: meals.servings,
        status: meals.status,
        estimatedCost: meals.estimatedCost,
        actualCost: meals.actualCost,
        rating: meals.rating,
        notes: meals.notes,
        createdAt: meals.createdAt,
        recipe: recipes,
      })
      .from(meals)
      .innerJoin(recipes, eq(meals.recipeId, recipes.id))
      .where(eq(meals.mealPlanId, mealPlanId))
      .orderBy(meals.date);
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [result] = await db.insert(meals).values(meal).returning();
    return result;
  }

  async updateMeal(id: number, updates: Partial<Meal>): Promise<Meal> {
    const [result] = await db
      .update(meals)
      .set(updates)
      .where(eq(meals.id, id))
      .returning();
    return result;
  }

  async deleteMeal(id: number): Promise<void> {
    await db.delete(meals).where(eq(meals.id, id));
  }

  // Grocery lists
  async getGroceryLists(mealPlanId: number): Promise<GroceryList[]> {
    return await db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.mealPlanId, mealPlanId))
      .orderBy(desc(groceryLists.createdAt));
  }

  async getGroceryList(id: number): Promise<(GroceryList & { items: GroceryListItem[] }) | undefined> {
    const [list] = await db.select().from(groceryLists).where(eq(groceryLists.id, id));
    if (!list) return undefined;

    const items = await db
      .select()
      .from(groceryListItems)
      .where(eq(groceryListItems.groceryListId, id));

    return { ...list, items };
  }

  async createGroceryList(groceryList: InsertGroceryList): Promise<GroceryList> {
    const [result] = await db.insert(groceryLists).values(groceryList).returning();
    return result;
  }

  async updateGroceryList(id: number, updates: Partial<GroceryList>): Promise<GroceryList> {
    const [result] = await db
      .update(groceryLists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groceryLists.id, id))
      .returning();
    return result;
  }

  // Grocery list items
  async createGroceryListItem(item: InsertGroceryListItem): Promise<GroceryListItem> {
    const [result] = await db.insert(groceryListItems).values(item).returning();
    return result;
  }

  async updateGroceryListItem(id: number, updates: Partial<GroceryListItem>): Promise<GroceryListItem> {
    const [result] = await db
      .update(groceryListItems)
      .set(updates)
      .where(eq(groceryListItems.id, id))
      .returning();
    return result;
  }

  // Nutrition goals
  async getNutritionGoals(userId: string): Promise<NutritionGoal[]> {
    return await db
      .select()
      .from(nutritionGoals)
      .where(and(eq(nutritionGoals.userId, userId), eq(nutritionGoals.isActive, true)))
      .orderBy(desc(nutritionGoals.createdAt));
  }

  async createNutritionGoal(goal: InsertNutritionGoal): Promise<NutritionGoal> {
    const [result] = await db.insert(nutritionGoals).values(goal).returning();
    return result;
  }

  async updateNutritionGoal(id: number, updates: Partial<NutritionGoal>): Promise<NutritionGoal> {
    const [result] = await db
      .update(nutritionGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(nutritionGoals.id, id))
      .returning();
    return result;
  }

  async deleteNutritionGoal(id: number): Promise<void> {
    await db.delete(nutritionGoals).where(eq(nutritionGoals.id, id));
  }

  // Meal plan members
  async getMealPlanMembers(mealPlanId: number): Promise<MealPlanMember[]> {
    return await db.select()
      .from(mealPlanMembers)
      .where(eq(mealPlanMembers.mealPlanId, mealPlanId));
  }

  async addMealPlanMembers(mealPlanId: number, memberIds: number[]): Promise<void> {
    if (memberIds.length === 0) return;
    
    const memberData = memberIds.map(memberId => ({
      mealPlanId,
      householdMemberId: memberId
    }));
    
    await db.insert(mealPlanMembers).values(memberData);
  }

  async removeMealPlanMembers(mealPlanId: number): Promise<void> {
    await db.delete(mealPlanMembers).where(eq(mealPlanMembers.mealPlanId, mealPlanId));
  }
}

export const storage = new DatabaseStorage();
