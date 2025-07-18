# FoodGo - AI-Powered Meal Planning Application

## Overview

FoodGo is a full-stack web application that helps users plan weekly meals while optimizing for cost savings and time efficiency. The application uses AI to generate personalized meal plans based on household member preferences, dietary restrictions, available cooking equipment, and nutrition goals. It creates consolidated grocery lists organized by store layout to streamline shopping.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with custom Tailwind CSS styling
- **Styling**: Tailwind CSS with custom design system using CSS variables
- **Build Tool**: Vite with React plugin
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **AI Integration**: OpenAI API for meal plan generation

### Database Schema
The application uses a relational database with the following key entities:
- **Users**: Core user profiles with authentication data
- **Household Members**: Individual profiles with dietary preferences and restrictions
- **Cooking Equipment**: User's available kitchen tools
- **Meal Plans**: Generated weekly meal plans with metadata
- **Recipes**: Detailed recipe information with ingredients
- **Meals**: Individual meal instances within meal plans
- **Grocery Lists**: Consolidated shopping lists with store organization
- **Nutrition Goals**: User-defined health and nutrition objectives

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC
- **Session Storage**: PostgreSQL-backed sessions with 7-day TTL
- **Authorization**: Route-level protection with middleware
- **User Management**: Automatic user creation and profile updates

### AI Meal Generation
- **Engine**: OpenAI GPT-4o for intelligent meal planning
- **Optimization**: Ingredient overlap maximization to reduce waste
- **Personalization**: Dietary restrictions, preferences, and equipment consideration
- **Nutrition**: Goal-based meal suggestions with hidden vegetable strategies

### Data Management
- **ORM**: Drizzle with PostgreSQL dialect
- **Migrations**: Automated schema versioning
- **Validation**: Zod schemas for type-safe data handling
- **Caching**: React Query for efficient data fetching and caching

### User Interface
- **Design System**: Custom Tailwind configuration with semantic color tokens
- **Components**: Reusable UI components based on Radix primitives
- **Responsive**: Mobile-first design with adaptive layouts
- **Accessibility**: ARIA compliance through Radix UI foundations

## Data Flow

1. **User Onboarding**: Users authenticate via Replit Auth and set up household profiles
2. **Profile Setup**: Users add household members, dietary restrictions, and cooking equipment
3. **Meal Planning**: AI generates personalized meal plans based on user preferences
4. **Review & Approval**: Users can review, modify, or regenerate meal suggestions
5. **Grocery Generation**: System creates consolidated, store-organized shopping lists
6. **Execution**: Users follow meal plans and track nutrition goal progress

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe database operations
- **openai**: AI meal generation capabilities
- **@tanstack/react-query**: Client-side data management
- **@radix-ui/react-***: Accessible UI component primitives

### Authentication
- **openid-client**: OIDC authentication handling
- **passport**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session storage

### Development Tools
- **vite**: Frontend build tool with HMR
- **typescript**: Type safety across the stack
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit development integration

## Deployment Strategy

### Development Environment
- **Runtime**: Replit development server with hot reload
- **Database**: Neon PostgreSQL with automatic provisioning
- **Frontend**: Vite dev server with middleware integration
- **Authentication**: Replit Auth with development domain support

### Production Build
- **Frontend**: Vite production build with optimizations
- **Backend**: esbuild compilation to ES modules
- **Database**: Drizzle migrations for schema deployment
- **Deployment**: Single-command deployment via npm scripts

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **Authentication**: `REPLIT_DOMAINS` and `SESSION_SECRET` for auth
- **AI**: `OPENAI_API_KEY` for meal generation
- **Build**: `NODE_ENV` for environment-specific behavior

## Changelog

- July 18, 2025. Completed Cost Estimation Implementation with Comprehensive Disclaimers
  - Successfully implemented cost estimation throughout the consolidated ingredients feature
  - Added estimated pricing to ConsolidatedIngredientsModal with prominent cost display cards and amber disclaimer banners
  - Enhanced InstacartFormatView summary section with cost information and "may vary" warnings
  - Updated PrintableShoppingList with total cost, section-level costs, and individual ingredient pricing
  - Added comprehensive price disclaimers warning users that estimates may vary significantly by store, location, brand, and time
  - Fixed JavaScript parsing errors in consolidatedIngredientsService by removing duplicate generateEstimatedPrice functions
  - Updated generateDownloadContent to include cost information with disclaimers in downloaded shopping lists
  - Backend services now properly calculate and return totalCost for both individual meal plans and multi-meal plan groups
  - All cost displays include clear warnings that prices are estimates only and should be used for planning purposes
  - System maintains grocery-ready format while providing helpful cost planning information with appropriate disclaimers

- July 18, 2025. Redesigned Meal Planning Architecture - ChatGPT Generates Complete Meal Plans with Instacart-Ready Ingredients
  - Completely redesigned multi-meal plan generation to have OpenAI/ChatGPT generate everything in proper format from the start
  - Enhanced OpenAI prompts to generate ingredients already in Instacart-friendly format (lbs, packages, bottles, bags)
  - Added specific requirements for grocery shopping units instead of cooking measurements in consolidated shopping lists
  - Updated multi-meal plan generator to use OpenAI's consolidated shopping list directly, eliminating unit conversions
  - OpenAI now generates complete meal plans with recipes, detailed instructions, AND optimized shopping lists in grocery format
  - System flow: User creates meal plan → OpenAI generates meals with recipes AND Instacart-ready shopping list → No conversion needed
  - Enhanced prompt examples with proper grocery units: "2 lbs chicken breast", "1 5 lb bag flour", "1 16.9 fl oz bottle olive oil"
  - Removed complex unit conversion logic in favor of intelligent AI-generated shopping lists
  - ChatGPT handles ingredient optimization, consolidation, and grocery shopping format generation in single request
  - Architecture now follows: Requirements → OpenAI → Complete meal plans + recipes + shopping list (all ready for use)

- July 18, 2025. Enhanced Ingredient Consolidation Algorithm and Fixed Purchasable Units System
  - Fixed ingredient consolidation bug where amounts were being concatenated instead of added (e.g., "1 + 3 + 2 + 2 + 2 + 2 tablespoon olive oil")
  - Enhanced consolidateAmounts function to properly extract numeric values from ingredient amounts
  - Added intelligent unit matching for case-insensitive comparisons
  - Improved numeric consolidation with proper decimal handling
  - Updated both single meal plan and group consolidation logic to use enhanced algorithm
  - System now correctly shows "12 tablespoon olive oil" instead of "1 + 3 + 2 + 2 + 2 + 2 tablespoon olive oil"
  - Fixed PrintableShoppingList component to work without pricing information
  - Enhanced ingredient consolidation to maintain consistent units across combined ingredients

- July 18, 2025. Removed Pricing/Budget Features from Meal Planning System
  - Removed budget input field from meal plan creation form for cleaner interface
  - Eliminated pricing information from consolidated ingredients modal and backend services
  - Updated ConsolidatedIngredient interface to remove estimatedPrice field
  - Removed totalCost calculations from consolidated ingredients responses
  - Simplified ingredients display to show only name, amount, unit, and category
  - Enhanced "I already have this" functionality to work without pricing calculations
  - Streamlined dashboard cards to show only essential metrics (shopping items, meal plans, recipes)
  - Backend services no longer generate mock pricing data for more accurate user experience
  - Purchase workflows (Self Purchase and AI Purchase) now focus on ingredient organization rather than cost optimization
  - System is now more focused on meal planning and ingredient management without distracting/inaccurate pricing information

- July 18, 2025. Phase 2 Consolidated Ingredients Feature Implementation Complete
  - Successfully implemented complete Purchase Options Selection workflow with enhanced UI
  - Enhanced Self Purchase workflow with AI-powered store aisle organization and print functionality
  - Completed AI Purchase workflow with Instacart-formatted lists and ChatGPT integration
  - Fixed critical JSON parsing bug in OpenAI store organization service
  - Added PrintableShoppingList component with professional print layout and styling
  - Enhanced ConsolidatedIngredientsModal with improved navigation, visual feedback, and cost summaries
  - Implemented print functionality for shopping lists with proper print stylesheets
  - Added support for 10 major grocery store chains (Walmart, Target, Kroger, Safeway, Whole Foods, Costco, Publix, H-E-B, Trader Joe's, ALDI)
  - Enhanced InstacartFormatView with ingredient summaries, categories, and editing capabilities
  - Fixed authentication issues in consolidated ingredients API endpoints
  - Phase 2 now fully functional with both Self Purchase and AI Purchase workflows ready for production use

- July 18, 2025. Consolidated Ingredients Feature Design & Architecture Planning
  - Created comprehensive design document (CONSOLIDATED_INGREDIENTS_DESIGN.md) for advanced ingredient consumption workflows
  - Developed detailed feature tracker (CONSOLIDATED_INGREDIENTS_FEATURES.md) with 10 core features across 4-week implementation plan
  - Designed two-option purchase workflow: Self Purchase (store aisle organization) and AI Purchase (Instacart integration)
  - Analyzed existing infrastructure: grocery list consolidation API, database schema, and UI components already support core functionality
  - Planned OpenAI integration for store-specific aisle organization and ChatGPT Instacart formatting
  - Identified integration points with existing meal plan interfaces for seamless user experience
  - Established success metrics: 80% adoption rate, both options used by 40% of users, <500ms consolidation performance
  - Feature leverages existing consolidated grocery list functionality while adding specialized purchasing workflows
  - Implementation phases: Week 1 (Core Infrastructure), Week 2 (Self Purchase), Week 3 (AI Purchase), Week 4 (Polish)

- July 18, 2025. Phase 3 & 4 Implementation Complete - AI Purchase Workflow with Polish & Optimization
  - Enhanced AI prompt with detailed cooking-to-grocery unit conversion rules (cups → bags, tablespoons → bottles)
  - Added smart fallback conversion function for 15+ ingredient types with grocery-appropriate package sizes
  - Implemented store layout caching system with 24-hour TTL for faster organization performance
  - Added comprehensive keyboard shortcuts: Ctrl/Cmd+1/2 (purchase modes), Ctrl/Cmd+D/P (download/print), Escape (navigation)
  - Enhanced accessibility with ARIA labels, focus management, and keyboard navigation support
  - Implemented user preference storage for store selection and preferred purchase workflow
  - Improved loading states with progress indicators and detailed error handling with retry options
  - Added keyboard shortcuts help panel (Shift+?) with visual shortcut reference
  - Optimized performance with intelligent caching and better user feedback throughout the interface

- July 18, 2025. Fixed Consolidated Multi-Meal Plan Dashboard Display & Error Handling
  - Fixed critical bug where CleanHome.tsx was displaying individual meal plans instead of consolidated groups
  - Updated CleanHome.tsx to properly group meal plans by groupId for consolidated display
  - Fixed totalCost.toFixed() error in MealPlanGroupDetails.tsx by ensuring proper number parsing
  - Fixed backend consolidated grocery list API error handling for number type conversion
  - Multi-meal plans now correctly appear as single "Week X" entries instead of separate individual plans
  - Current Meal Plan section shows grouped information with all meal plans in the group
  - Recent Meal Plan Groups section displays consolidated entries with combined budget and meal plan tags
  - Active Plans counter shows the number of groups instead of individual plans
  - Enhanced error handling for grocery list price calculations to prevent runtime errors
  - System now properly consolidates "Adult Meal Plan" and "Kids Meal Plan" into unified "Week X" group entries

- July 17, 2025. Multi-Meal Plan Generator with Ingredient Optimization & Nutrition Goals Integration
  - Implemented comprehensive multi-meal plan generation system for different target groups
  - Added MultiMealPlanForm component for creating multiple coordinated meal plans (adults, kids, dietary restrictions)
  - Created enhancedMultiMealPlanGenerator service with advanced OpenAI integration
  - Added generateMultiMealPlan function to OpenAI service with cross-plan optimization
  - Implemented ingredient overlap optimization to minimize waste and maximize cost savings
  - Added support for consolidated grocery lists with shared ingredients across plans
  - Created MultiMealPlanGenerator page with comprehensive form and benefits display
  - Added /multi-meal-plan-generator route with sidebar showing household members and equipment
  - Enhanced home page with "Multi-Plan Generator" button for easy access
  - Added isUnauthorizedError utility function for proper error handling
  - OpenAI generates optimized meal plans with shared ingredients like onions, garlic, spices
  - System tracks ingredient usage across plans and estimates cost savings
  - Nutrition summary includes overall averages and plan-specific comparisons
  - Enhanced API with /api/meal-plans/generate-multi endpoint using new generator
  - Added comprehensive error handling and logging for multi-plan generation
  - **NEW: Nutrition Goals Integration** - Multi-meal plan generator now incorporates user's nutrition goals
  - Added nutritionGoals parameter to MultiMealPlanRequest interface
  - OpenAI prompts now include user's nutrition goals with current progress and target values
  - System considers nutrition goals when generating meal plans across multiple target groups
  - Enhanced logging to track when nutrition goals are being applied to meal planning
  - **NEW: Consolidated Multi-Meal Plan Dashboard** - Unified view for meal plan groups
  - Home page now displays meal plan groups instead of individual meal plans
  - Created MealPlanGroupDetails page showing all plans in a group with consolidated grocery lists
  - Added API endpoints for meal plan groups (/api/meal-plan-groups, /api/meal-plan-groups/:id)
  - Implemented consolidated grocery list generation combining ingredients from all plans in a group
  - Added tabbed interface showing group overview, all meals, and consolidated shopping list
  - Users can now view multiple coordinated meal plans as a single unified system
  - Dashboard shows cost savings, ingredient optimization, and total meal counts across all plans

- July 16, 2025. Recipe Rejection & AI Replacement Feature implementation
  - Added thumbs down functionality for recipe rejection in meal plan details
  - Created recipeReplacement service using OpenAI for intelligent recipe substitution
  - Added /api/meals/:mealId/replace-recipe endpoint for AI-powered recipe replacement
  - Fixed database schema issue: changed recipe_ingredients.amount from decimal to varchar
  - AI replacement considers user preferences, dietary restrictions, and meal plan goals
  - Real-time UI updates when recipes are replaced with loading states
  - Generates completely new recipes that avoid rejected ingredients and styles
  - Maintains meal plan consistency with serving sizes and meal types
  - Available in both meal plan cards and detailed recipe modal views

- July 16, 2025. Phase 2 Recipe Management & Customization implementation
  - Implemented comprehensive Recipe Library with search, filtering, and categorization
  - Built RecipeCustomizer component with AI-powered recipe modification
  - Added recipe management API endpoints (/api/recipes, /api/recipes/search, /api/recipes/:id/customize)
  - Created recipeCustomizer service using OpenAI for intelligent recipe adaptation
  - Integrated recipe library and customizer into main application routing
  - Added 12 modification options (healthier, vegetarian, vegan, gluten-free, dairy-free, etc.)
  - Implemented serving size scaling with real-time ingredient adjustment
  - Added recipe saving functionality to preserve customized recipes
  - Enhanced recipe display with nutrition facts, difficulty ratings, and cooking times
  - Created comprehensive recipe browsing interface with pagination and visual cards
  - Added recipe sharing and detailed ingredient viewing capabilities
  - Integrated with existing meal plan recipes for seamless customization workflow

- July 16, 2025. Phase 1 Multi-Target Foundation implementation
  - Implemented Phase 1 of multi-target meal planning system with enhanced database schema
  - Added meal_plan_groups table for organizing multi-target meal plans
  - Extended meal_plans table with groupId, targetGroup, duration, and mealTypes fields
  - Created comprehensive MealPlanWizard component with 3-step configuration process
  - Built multiMealPlanGenerator service for intelligent ingredient consolidation
  - Added /api/meal-plans/generate-multi endpoint for multi-target meal plan generation
  - Implemented ingredient overlap optimization to reduce waste and costs
  - Enhanced Home page with multi-target meal planning features and quick stats
  - Added support for separate meal plans for adults, kids, and dietary restrictions
  - Created consolidated grocery list generation with ingredient deduplication
  - Added optimization metrics tracking (shared ingredients, cost savings, waste reduction)
  - Updated storage interface with meal plan group operations
  - Comprehensive meal planning system design document (MEAL_PLANNING_SYSTEM_DESIGN.md)
  - Expanded feature tracker with 21 detailed features across 5 implementation phases
  - Fixed OpenAI response format parsing issue where API returned {"mealPlan": [...]} instead of {"meals": [...]}
  - Enhanced AI prompt with explicit JSON structure specification
  - Added debugging logs to track meal creation and ingredient consolidation

- July 11, 2025. Meal plan details view and infinite loop debugging
  - Fixed critical React infinite loop issue caused by Radix UI components
  - Replaced problematic UI components with native HTML elements
  - Created comprehensive meal plan details view (/meal-plan/:id)
  - Added meal plan ingredients and recipe viewing functionality
  - Enhanced meal plan form with nutrition goals (reduced calories, higher protein, etc.)
  - Added meal type selection (breakfast, lunch, dinner, snacks)
  - Added duration options (3 days, 1 week, 2 weeks) and budget planning
  - Created API endpoints for meal plan details, recipe ingredients, and grocery lists
  - Updated Home component with meal plan navigation and recent meal plans display
  - Fixed backend meal plan generation errors with proper error handling

- July 08, 2025. Household member selection and meal planning workflow redesign
  - Implemented household member selection for meal plans
  - Added HouseholdMemberSelector component with multi-select functionality
  - Enhanced MealPlanModal to include member selection with validation
  - Created meal_plan_members table for associating members with meal plans
  - Updated API to handle selected members in meal plan generation
  - Enabled first feature in tracker: "Household Member Selection" 
  - Identified fundamental issues with current meal planning flow
  - Created comprehensive design document for proper workflow
  - User should create meal plan → generate individual recipes → approve/reject → finalize → create grocery list
  - Current implementation skips individual recipe generation and approval steps
  - Created feature tracker with toggleable features for incremental implementation

- July 03, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.