# FoodGo Meal Planning System Design Document

## Overview
FoodGo needs a comprehensive meal planning workflow that generates individual recipes for each requested meal, allows user approval/rejection, and creates finalized grocery lists only after meal approval.

## Current Issues
- Meal plan generation creates a plan without individual recipes
- No user approval/rejection workflow for generated meals
- Grocery lists are created immediately without user validation
- No individual meal management or recipe viewing

## Proposed Workflow

### 1. Meal Plan Creation
**User Action**: Creates a meal plan with preferences
- Duration (e.g., 7 days)
- Meal types (breakfast, lunch, dinner)
- **Household member selection** (specific people to include in this plan)
- Dietary restrictions and preferences (aggregated from selected members)
- Budget constraints
- Plan name and description

**System Response**: Creates a meal plan record with "planning" status and selected household members

**Multiple Meal Plans**: Users can create separate meal plans for different groups:
- "Kids Meals" plan (children only)
- "Adult Meals" plan (adults only)
- "Family Meals" plan (everyone)
- "Vegetarian Week" plan (vegetarian family members)

### 2. Recipe Generation Phase
**System Action**: For each meal slot in the plan:
- Generate individual recipe using OpenAI
- Create recipe record with ingredients
- Create meal record linking recipe to meal plan
- Set meal status to "pending_approval"

**User Interface**: Dashboard shows meal plan with individual meal cards
- Each meal shows: name, image, prep time, difficulty
- "View Recipe" button to see full details
- "Accept" and "Reject" buttons for each meal

### 3. User Approval Process
**User Action**: Reviews each generated meal
- View full recipe details (ingredients, instructions, nutrition)
- Accept meal → status changes to "approved"
- Reject meal → system generates new recipe for that slot

**System Response**: Tracks approval status for each meal
- Meal plan remains in "planning" until all meals approved
- Regenerates rejected meals with different constraints

### 4. Finalization
**User Action**: Once all meals approved, finalizes meal plan
**System Response**: 
- Changes meal plan status to "active"
- Consolidates all approved recipe ingredients
- Creates optimized grocery list with store organization
- Removes ingredient duplicates and optimizes quantities

### 5. Dashboard Management
**User Interface**: Shows different views based on meal plan status
- **Planning**: Shows approval interface with individual meals
- **Active**: Shows week overview with grocery list access
- **Completed**: Shows historical meal plans with ratings

## Database Schema Updates

### New Table: Meal Plan Members
```sql
CREATE TABLE meal_plan_members (
  id SERIAL PRIMARY KEY,
  meal_plan_id INTEGER REFERENCES meal_plans(id),
  household_member_id INTEGER REFERENCES household_members(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Meal Plan Statuses
- `planning`: Initial creation, recipes being generated/approved
- `active`: All meals approved, ready for execution
- `completed`: Meal plan finished
- `archived`: Old meal plans

### Meal Statuses
- `pending_approval`: Recipe generated, awaiting user decision
- `approved`: User accepted the meal
- `rejected`: User rejected, needs regeneration
- `completed`: Meal was prepared and consumed

### Recipe Generation Tracking
- Track generation attempts per meal slot
- Store rejection reasons for better regeneration
- Maintain recipe variation preferences
- **Household member context** for recipe generation

## Feature Implementation Plan

### Phase 1: Core Workflow (Priority 1)
- [ ] Update meal plan creation to "planning" status
- [ ] Implement individual recipe generation per meal
- [ ] Create meal approval UI components
- [ ] Add recipe regeneration capability

### Phase 2: User Experience (Priority 2)
- [ ] Recipe detail view with full information
- [ ] Meal approval/rejection interface
- [ ] Progress tracking for meal plan completion
- [ ] Batch approval capabilities

### Phase 3: Optimization (Priority 3)
- [ ] Ingredient consolidation and optimization
- [ ] Smart grocery list generation
- [ ] Recipe variation preferences
- [ ] Nutrition goal tracking per meal

### Phase 4: Enhancement (Priority 4)
- [ ] Meal rating and feedback system
- [ ] Recipe customization options
- [ ] Shopping list store integration
- [ ] Meal prep scheduling

## Technical Implementation

### API Endpoints Needed
- `POST /api/meal-plans` - Create meal plan with selected household members
- `POST /api/meal-plans/:id/generate-recipes` - Generate recipes for all meals
- `PUT /api/meals/:id/approve` - Approve a specific meal
- `PUT /api/meals/:id/reject` - Reject and regenerate meal
- `POST /api/meal-plans/:id/finalize` - Finalize approved meal plan
- `GET /api/meals/:id/recipe` - Get full recipe details
- `GET /api/meal-plans/:id/members` - Get household members for a meal plan

### Frontend Components
- `HouseholdMemberSelector` - Multi-select component for choosing plan members
- `MealPlanCreationForm` - Enhanced form with member selection
- `MealApprovalCard` - Individual meal with approve/reject buttons
- `RecipeDetailModal` - Full recipe view with ingredients and instructions
- `MealPlanProgress` - Progress indicator for approval process
- `PlanningDashboard` - Special dashboard view for planning phase
- `MealPlanCard` - Shows which household members are included

### Database Updates
- Add `generation_attempt` field to meals table
- Add `rejection_reason` field for learning
- Add `recipe_variation_preferences` to users table
- Update meal plan and meal status enums

## User Experience Flow

1. **Create Meal Plan**: User specifies preferences and **selects household members** → System creates plan in "planning" status
2. **Member-Aware Recipe Generation**: System generates individual recipes considering selected members' preferences → User sees grid of meal cards
3. **Review Phase**: User reviews each meal → Approves or rejects with feedback
4. **Regeneration**: For rejected meals → System creates new recipe variants
5. **Finalization**: All meals approved → System creates optimized grocery list
6. **Execution**: Active meal plan → User follows recipes and checks off grocery items

## Multiple Meal Plan Scenarios

### Scenario 1: Separate Kids and Adults Plans
- **Kids Plan**: Selected members: Child 1, Child 2
- **Adults Plan**: Selected members: Parent 1, Parent 2
- Different recipes, portions, and dietary considerations

### Scenario 2: Mixed Dietary Preferences
- **Vegetarian Plan**: Selected members: Vegetarian family members
- **Regular Plan**: Selected members: Non-vegetarian family members
- Different ingredient restrictions and recipe types

### Scenario 3: Special Occasions
- **Birthday Week**: Selected members: Birthday child + family
- **Date Night**: Selected members: Parents only
- **Extended Family**: Selected members: All + visiting relatives

## Success Metrics
- % of meals approved on first generation
- Time to complete meal plan approval
- User satisfaction with generated recipes
- Grocery list accuracy and cost optimization
- Meal completion rate

## Next Steps
1. Implement feature tracker with toggleable features
2. Update database schema with new statuses
3. Create meal approval UI components
4. Implement recipe generation per meal slot
5. Add meal approval/rejection workflow