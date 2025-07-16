import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Household members
export const householdMembers = pgTable("household_members", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  age: integer("age"),
  dietaryRestrictions: jsonb("dietary_restrictions").$type<string[]>().default([]),
  allergies: jsonb("allergies").$type<string[]>().default([]),
  preferences: jsonb("preferences").$type<string[]>().default([]),
  dislikes: jsonb("dislikes").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cooking equipment
export const cookingEquipment = pgTable("cooking_equipment", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'slow_cooker', 'instant_pot', 'air_fryer', etc.
  brand: varchar("brand"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meal plan groups (for multi-target planning)
export const mealPlanGroups = pgTable("meal_plan_groups", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meal plans
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  groupId: integer("group_id").references(() => mealPlanGroups.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  targetGroup: varchar("target_group").default("family"), // 'adults', 'kids', 'family', 'dietary'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  duration: integer("duration").notNull().default(7),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  goals: jsonb("goals").$type<string[]>().default([]),
  mealTypes: jsonb("meal_types").$type<string[]>().default(['dinner']),
  status: varchar("status").default("planning"), // 'planning', 'active', 'completed', 'archived'
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recipes
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  instructions: text("instructions").notNull(),
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  servings: integer("servings").notNull(),
  difficulty: varchar("difficulty").default("medium"), // 'easy', 'medium', 'hard'
  cuisine: varchar("cuisine"),
  tags: jsonb("tags").$type<string[]>().default([]),
  nutritionFacts: jsonb("nutrition_facts").$type<{
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  }>(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recipe ingredients
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  amount: varchar("amount"), // Changed from decimal to varchar to support "to taste", "1/2 cup", etc.
  unit: varchar("unit"),
  category: varchar("category"), // 'produce', 'meat', 'dairy', etc.
  optional: boolean("optional").default(false),
});

// Meals (instances of recipes in meal plans)
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id, { onDelete: "cascade" }).notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  date: timestamp("date").notNull(),
  mealType: varchar("meal_type").notNull(), // 'breakfast', 'lunch', 'dinner', 'snack'
  servings: integer("servings").notNull(),
  status: varchar("status").default("planned"), // 'planned', 'approved', 'rejected'
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  rating: integer("rating"), // 1-5 stars
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grocery lists
export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  store: varchar("store"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  status: varchar("status").default("active"), // 'active', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grocery list items
export const groceryListItems = pgTable("grocery_list_items", {
  id: serial("id").primaryKey(),
  groceryListId: integer("grocery_list_id").references(() => groceryLists.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  unit: varchar("unit"),
  category: varchar("category"),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  actualPrice: decimal("actual_price", { precision: 10, scale: 2 }),
  purchased: boolean("purchased").default(false),
  notes: text("notes"),
  aisle: varchar("aisle"),
});

// Nutrition goals
export const nutritionGoals = pgTable("nutrition_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).default("0"),
  unit: varchar("unit"),
  period: varchar("period").default("weekly"), // 'daily', 'weekly', 'monthly'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meal Plan Members (for household member selection)
export const mealPlanMembers = pgTable("meal_plan_members", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id, { onDelete: "cascade" }).notNull(),
  householdMemberId: integer("household_member_id").references(() => householdMembers.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  householdMembers: many(householdMembers),
  cookingEquipment: many(cookingEquipment),
  mealPlans: many(mealPlans),
  mealPlanGroups: many(mealPlanGroups),
  nutritionGoals: many(nutritionGoals),
}));

export const householdMembersRelations = relations(householdMembers, ({ one }) => ({
  user: one(users, {
    fields: [householdMembers.userId],
    references: [users.id],
  }),
}));

export const cookingEquipmentRelations = relations(cookingEquipment, ({ one }) => ({
  user: one(users, {
    fields: [cookingEquipment.userId],
    references: [users.id],
  }),
}));

export const mealPlanGroupsRelations = relations(mealPlanGroups, ({ one, many }) => ({
  user: one(users, {
    fields: [mealPlanGroups.userId],
    references: [users.id],
  }),
  mealPlans: many(mealPlans),
}));

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
  group: one(mealPlanGroups, {
    fields: [mealPlans.groupId],
    references: [mealPlanGroups.id],
  }),
  meals: many(meals),
  groceryLists: many(groceryLists),
  mealPlanMembers: many(mealPlanMembers),
}));

export const mealPlanMembersRelations = relations(mealPlanMembers, ({ one }) => ({
  mealPlan: one(mealPlans, { fields: [mealPlanMembers.mealPlanId], references: [mealPlans.id] }),
  householdMember: one(householdMembers, { fields: [mealPlanMembers.householdMemberId], references: [householdMembers.id] }),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  meals: many(meals),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  mealPlan: one(mealPlans, {
    fields: [meals.mealPlanId],
    references: [mealPlans.id],
  }),
  recipe: one(recipes, {
    fields: [meals.recipeId],
    references: [recipes.id],
  }),
}));

export const groceryListsRelations = relations(groceryLists, ({ one, many }) => ({
  mealPlan: one(mealPlans, {
    fields: [groceryLists.mealPlanId],
    references: [mealPlans.id],
  }),
  items: many(groceryListItems),
}));

export const groceryListItemsRelations = relations(groceryListItems, ({ one }) => ({
  groceryList: one(groceryLists, {
    fields: [groceryListItems.groceryListId],
    references: [groceryLists.id],
  }),
}));

export const nutritionGoalsRelations = relations(nutritionGoals, ({ one }) => ({
  user: one(users, {
    fields: [nutritionGoals.userId],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertHouseholdMember = typeof householdMembers.$inferInsert;
export type HouseholdMember = typeof householdMembers.$inferSelect;

export type InsertCookingEquipment = typeof cookingEquipment.$inferInsert;
export type CookingEquipment = typeof cookingEquipment.$inferSelect;

export type InsertMealPlanGroup = typeof mealPlanGroups.$inferInsert;
export type MealPlanGroup = typeof mealPlanGroups.$inferSelect;

export type InsertMealPlan = typeof mealPlans.$inferInsert;
export type MealPlan = typeof mealPlans.$inferSelect;

export type InsertRecipe = typeof recipes.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;

export type InsertRecipeIngredient = typeof recipeIngredients.$inferInsert;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;

export type InsertMeal = typeof meals.$inferInsert;
export type Meal = typeof meals.$inferSelect;

export type InsertGroceryList = typeof groceryLists.$inferInsert;
export type GroceryList = typeof groceryLists.$inferSelect;

export type InsertGroceryListItem = typeof groceryListItems.$inferInsert;
export type GroceryListItem = typeof groceryListItems.$inferSelect;

export type InsertNutritionGoal = typeof nutritionGoals.$inferInsert;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;

export type InsertMealPlanMember = typeof mealPlanMembers.$inferInsert;
export type MealPlanMember = typeof mealPlanMembers.$inferSelect;

// Zod schemas
export const insertHouseholdMemberSchema = createInsertSchema(householdMembers).omit({
  id: true,
  createdAt: true,
});

export const insertCookingEquipmentSchema = createInsertSchema(cookingEquipment).omit({
  id: true,
  createdAt: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  createdAt: true,
});

export const insertGroceryListSchema = createInsertSchema(groceryLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
