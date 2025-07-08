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