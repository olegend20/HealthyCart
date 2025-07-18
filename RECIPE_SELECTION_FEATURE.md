# Add Existing Recipes to Meal Plan - Feature Design & Tracker

## Overview
This feature allows users to add existing recipes from their personal recipe library to a meal plan during the meal plan creation process. Users can browse, search, and select their saved recipes as an alternative or supplement to AI-generated meal plans.

## Current State Analysis

### Existing Infrastructure ✅
- **Recipe Library System**: Complete recipe CRUD operations with user isolation
- **Meal Plan Structure**: Well-defined meal plan and meals schema with recipe relationships
- **Recipe API**: Full API endpoints for recipe management (`/api/recipes`, `/api/recipes/search`)
- **User Recipe Association**: `userRecipes` table for user-specific recipe libraries
- **Recipe Components**: `RecipeLibrary.tsx` and `RecipeCustomizer.tsx` exist

### Database Schema (Ready) ✅
```sql
-- meals table links recipes to meal plans
meals {
  id: serial PRIMARY KEY,
  mealPlanId: integer → mealPlans.id,
  recipeId: integer → recipes.id,  // This is what we'll use
  date: timestamp,
  mealType: varchar,  // 'breakfast', 'lunch', 'dinner', 'snack'
  servings: integer,
  status: varchar DEFAULT 'planned'
}
```

## Feature Design

### User Flow
1. **During Meal Plan Creation**: User sees option to add existing recipes
2. **Recipe Selection**: Modal/drawer with user's recipe library
3. **Search & Filter**: Search by name, filter by cuisine, difficulty, tags
4. **Recipe Assignment**: Select recipes for specific days and meal types
5. **Confirmation**: Review selected recipes before generating remaining AI meals

### UI Components Needed

#### 1. Recipe Selection Modal (`RecipeSelectionModal.tsx`)
```typescript
interface RecipeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipes: (selectedRecipes: SelectedRecipe[]) => void;
  mealPlanDuration: number;
  selectedMealTypes: string[];
}

interface SelectedRecipe {
  recipeId: number;
  recipe: Recipe;
  assignments: Array<{
    date: string; // ISO date string
    mealType: string;
    servings: number;
  }>;
}
```

#### 2. Recipe Assignment Interface (`RecipeAssignmentGrid.tsx`)
- Calendar-style grid showing days and meal types
- Drag-and-drop or click-to-assign recipes to specific slots
- Visual feedback for assigned vs. available slots

#### 3. Enhanced Meal Plan Generator
- Add "Include Existing Recipes" toggle in form
- Show count of available user recipes
- Preview selected recipes before generation

### API Endpoints Needed

#### New Endpoint: Mixed Meal Plan Generation
```typescript
POST /api/meal-plans/generate-mixed
{
  // Existing meal plan data
  name: string;
  duration: number;
  startDate: string;
  // New: selected recipes
  selectedRecipes: Array<{
    recipeId: number;
    date: string;
    mealType: string;
    servings: number;
  }>;
  // AI generation for remaining slots
  generateRemaining: boolean;
}
```

#### Enhanced Recipe Search
```typescript
GET /api/recipes/search?q=string&cuisine=string&difficulty=string&tags=string[]
```

## Implementation Plan

### Phase 1: Core Recipe Selection (Week 1)
- [ ] **Day 1-2**: Create `RecipeSelectionModal` component
  - Recipe grid with search and filters
  - Recipe cards with key info (name, prep time, servings)
  - Selection state management
- [ ] **Day 3**: Build `RecipeAssignmentGrid` component
  - Calendar-style layout for meal assignments
  - Drag-and-drop or click-to-assign functionality
  - Visual indicators for assigned recipes
- [ ] **Day 4-5**: Integrate into `MealPlanGenerator`
  - Add toggle for "Include Existing Recipes"
  - Show recipe selection button when enabled
  - Display count of user's available recipes

### Phase 2: Backend Integration (Week 2)
- [ ] **Day 1-2**: Create mixed meal plan generation API
  - New `/api/meal-plans/generate-mixed` endpoint
  - Logic to combine selected recipes with AI generation
  - Validation for recipe assignments
- [ ] **Day 3**: Enhanced recipe search functionality
  - Add filtering by cuisine, difficulty, tags
  - Optimize search performance
  - Add recipe count for UI feedback
- [ ] **Day 4-5**: Update meal plan storage
  - Modify meal plan creation to handle mixed sources
  - Add metadata to track recipe sources (AI vs. user-selected)
  - Update meal status tracking

### Phase 3: UX Enhancements (Week 3)
- [ ] **Day 1-2**: Advanced assignment features
  - Bulk assignment (same recipe to multiple days)
  - Recipe recommendations based on meal type
  - Conflict resolution for over-assigned recipes
- [ ] **Day 3**: Visual improvements
  - Recipe thumbnails in assignment grid
  - Better loading states during search
  - Improved mobile responsiveness
- [ ] **Day 4-5**: Smart defaults and validation
  - Auto-assign recipes to appropriate meal types
  - Validate serving sizes and adjust automatically
  - Warning for incomplete meal plans

## Technical Considerations

### Frontend State Management
```typescript
// Recipe selection state
interface RecipeSelectionState {
  selectedRecipes: Map<number, SelectedRecipe>;
  searchQuery: string;
  filters: {
    cuisine?: string;
    difficulty?: string;
    tags: string[];
  };
  assignments: Map<string, number>; // "date-mealType" → recipeId
}
```

### Performance Optimizations
- **Recipe Search**: Debounced search with local caching
- **Large Libraries**: Virtualized recipe list for 100+ recipes
- **Assignment Grid**: Efficient re-rendering with React.memo
- **Image Loading**: Lazy loading for recipe thumbnails

### Error Handling
- Recipe no longer available in user's library
- Recipe serving size conflicts
- Date/meal type assignment conflicts
- Network errors during recipe fetching

## Success Metrics

### User Experience
- [ ] Users can find recipes in under 5 seconds
- [ ] Assignment process takes less than 30 seconds
- [ ] Mobile experience is fully functional
- [ ] No more than 2 clicks to assign a recipe

### Technical Performance
- [ ] Recipe search responds in under 200ms
- [ ] Modal loads in under 500ms
- [ ] Assignment grid updates without lag
- [ ] Handles 500+ recipes without performance issues

## Future Enhancements

### Advanced Features
- **Recipe Groups**: Create and save recipe collections
- **Smart Suggestions**: AI-powered recipe recommendations
- **Nutritional Balance**: Warn about nutritional gaps
- **Shopping Integration**: Merge ingredients from selected recipes

### Integration Opportunities
- **Recipe Import**: From popular recipe websites
- **Meal History**: Suggest previously used recipes
- **Family Preferences**: Filter by family member preferences
- **Seasonal Suggestions**: Highlight seasonal recipes

## Dependencies

### Required Components
- Recipe search functionality (exists)
- User recipe library (exists)
- Meal plan generation API (exists)
- UI components from shadcn/ui

### Optional Enhancements
- Drag-and-drop library (react-beautiful-dnd)
- Virtual scrolling (react-window)
- Advanced search (fuse.js)

## Testing Strategy

### Unit Tests
- Recipe selection state management
- Assignment validation logic
- Search and filter functionality

### Integration Tests
- Modal open/close behavior
- Recipe assignment flow
- API integration with meal plan generation

### User Testing
- Recipe discovery and selection
- Assignment interface usability
- Mobile experience validation

---

## Implementation Notes

### Current Architecture Benefits
- **User Isolation**: Recipes are properly isolated per user
- **Flexible Schema**: Meals table supports any recipe source
- **Existing APIs**: Recipe management is already complete
- **Component Reuse**: Can leverage existing recipe components

### Potential Challenges
- **Complex State**: Managing selection + assignment state
- **Performance**: Large recipe libraries need optimization
- **UX Complexity**: Making assignment interface intuitive
- **Mobile UI**: Calendar-style grid on small screens

### Quick Wins
1. Start with simple list-based recipe selection
2. Use existing recipe cards from RecipeLibrary
3. Implement click-to-assign before drag-and-drop
4. Build desktop experience first, then mobile

---

*Last Updated: January 18, 2025*