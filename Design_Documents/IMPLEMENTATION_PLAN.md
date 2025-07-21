# HealthyCart Implementation Plan

## Current State Analysis

### What Works
- User authentication with Replit Auth
- Household member management
- Basic meal plan creation (creates record in database)
- OpenAI integration for meal generation
- Basic grocery list creation
- Frontend UI components and routing

### What's Broken
- Meal plan generation creates grocery lists immediately (should wait for approval)
- No individual recipe generation per meal slot
- No user approval/rejection workflow
- No recipe detail viewing
- No proper meal plan status tracking

## Implementation Strategy

### Phase 1: Core Workflow Foundation (Priority 1)
**Goal**: Fix the fundamental meal planning flow

#### 1.1 Individual Recipe Generation 🔴
**Current**: Meal plan generator creates a single response
**Target**: Generate individual recipes for each meal slot

**Database Changes**:
- Ensure recipes table is properly used
- Add meal-to-recipe relationships
- Store individual recipe data per meal

**API Changes**:
- Update meal plan generation to create individual recipes
- Store recipes in database during generation
- Link meals to specific recipes

**Implementation**:
```typescript
// For each meal slot (breakfast, lunch, dinner) * days
for (const day of mealPlan.days) {
  for (const mealType of mealTypes) {
    const recipe = await generateIndividualRecipe({
      mealType,
      date: day,
      householdMembers,
      dietaryRestrictions,
      equipment
    });
    
    const savedRecipe = await storage.createRecipe(recipe);
    await storage.createMeal({
      mealPlanId: mealPlan.id,
      recipeId: savedRecipe.id,
      date: day,
      mealType: mealType,
      status: 'pending_approval'
    });
  }
}
```

#### 1.2 Meal Plan Status System 🔴
**Current**: Meal plans go directly to "active"
**Target**: planning → active → completed flow

**Database Changes**:
- Update meal plans table status enum
- Add meal status tracking
- Update meal plan queries

**Status Flow**:
- `planning`: Initial creation, recipes being generated/approved
- `active`: All meals approved, ready for execution
- `completed`: Meal plan finished
- `archived`: Old meal plans

#### 1.3 Recipe Detail View 🔴
**Current**: No way to view individual recipe details
**Target**: Full recipe modal/page with ingredients and instructions

**Frontend Changes**:
- Create RecipeDetailModal component
- Add recipe viewing from meal cards
- Display ingredients, instructions, nutrition

#### 1.4 Meal Approval Workflow 🔴
**Current**: No approval process
**Target**: Approve/reject individual meals

**Frontend Changes**:
- Create MealApprovalCard component
- Add approve/reject buttons
- Show approval progress
- Different dashboard for planning vs active

**API Changes**:
- `PUT /api/meals/:id/approve`
- `PUT /api/meals/:id/reject`
- `POST /api/meal-plans/:id/finalize`

### Phase 2: Enhanced User Experience (Priority 2)

#### 2.1 Recipe Regeneration 🔴
**Target**: Regenerate rejected meals with new recipes

**Implementation**:
- Track rejection reasons
- Generate new recipes with different constraints
- Learn from user preferences

#### 2.2 Meal Planning Dashboard 🔴
**Target**: Specialized dashboard for planning phase

**Features**:
- Progress indicator for meal approvals
- Quick approve/reject actions
- Recipe preview cards
- Finalization button when all approved

#### 2.3 Optimized Grocery List Generation 🔴
**Target**: Create grocery lists only after all meals approved

**Implementation**:
- Delay grocery list creation until finalization
- Consolidate ingredients from approved recipes
- Optimize quantities and remove duplicates

### Phase 3: Advanced Features (Priority 3)

#### 3.1 Recipe Variation Preferences 🔴
**Target**: Learn from user rejections to improve future generations

#### 3.2 Batch Operations 🔴
**Target**: Approve/reject multiple meals at once

#### 3.3 Meal Completion Tracking 🔴
**Target**: Track which meals were actually prepared

## Technical Implementation Steps

### Step 1: Update Database Schema
```sql
-- Update meal plans table
ALTER TABLE meal_plans 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning' 
CHECK (status IN ('planning', 'active', 'completed', 'archived'));

-- Update meals table
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval'
CHECK (status IN ('pending_approval', 'approved', 'rejected', 'completed'));

-- Add generation tracking
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS generation_attempt INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

### Step 2: Update Meal Plan Generator
- Modify `generateCompleteMealPlan` to create individual recipes
- Store recipes in database
- Create meals with proper status
- Don't create grocery lists yet

### Step 3: Create Approval Interface
- MealApprovalCard component
- RecipeDetailModal component
- Planning dashboard view
- Approval/rejection API endpoints

### Step 4: Implement Recipe Regeneration
- Rejection handling
- New recipe generation
- Status updates

### Step 5: Add Grocery List Finalization
- Finalize meal plan endpoint
- Ingredient consolidation
- Optimized grocery list creation

## Testing Strategy

### Unit Tests
- Individual recipe generation
- Meal status transitions
- Ingredient consolidation
- API endpoint functionality

### Integration Tests
- Complete meal planning workflow
- Database state consistency
- UI component interactions

### User Testing
- Meal approval workflow usability
- Recipe quality assessment
- Grocery list accuracy

## Success Metrics

### Completion Metrics
- % of meal plans that complete approval process
- Time to approve all meals in a plan
- User satisfaction with generated recipes

### Quality Metrics
- Recipe approval rate on first generation
- Grocery list accuracy
- Meal completion rate

## Risk Mitigation

### Technical Risks
- OpenAI API rate limits during individual recipe generation
- Database performance with more complex queries
- Frontend complexity with approval workflow

### User Experience Risks
- Approval process being too time-consuming
- Recipe quality not meeting expectations
- Confusion about meal plan status

### Mitigation Strategies
- Implement batch recipe generation
- Add loading states and progress indicators
- Provide clear status information
- Allow skipping approval for trusted users

## Timeline

### Week 1: Foundation
- Days 1-2: Database schema updates
- Days 3-4: Individual recipe generation
- Days 5-7: Meal approval interface

### Week 2: Enhancement
- Days 1-3: Recipe regeneration
- Days 4-5: Optimized grocery lists
- Days 6-7: Testing and refinement

### Week 3: Polish
- Days 1-3: Advanced features
- Days 4-5: Performance optimization
- Days 6-7: User testing and feedback

## Next Actions

1. **Immediate**: Update database schema with new status fields
2. **Today**: Implement individual recipe generation
3. **This Week**: Create meal approval interface
4. **Next Week**: Add recipe regeneration and grocery list optimization