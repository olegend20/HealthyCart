# HealthyCart - AI-Powered Meal Planning Platform

## Overview
HealthyCart is an advanced AI-powered meal planning platform that generates comprehensive weekly meal plans tailored to user preferences, dietary needs, and nutritional goals. The platform helps users save time and money through intelligent ingredient optimization and automated grocery list generation.

## Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom email/password authentication with session management
- **AI Integration**: OpenAI GPT-4o for meal plan generation

## Authentication System
### Current Implementation
- **Primary Method**: Email/password authentication
- **Session Management**: Express sessions with PostgreSQL storage
- **Password Security**: bcrypt with 12 salt rounds
- **Backward Compatibility**: Supports existing Replit OIDC authentication

### Authentication Features
- User registration with email/password
- Secure login with password validation
- Session-based authentication
- Password change functionality
- User profile management with avatar support
- Logout functionality

### Database Schema
- `users` table supports both email/password and OIDC authentication
- Added `passwordHash`, `emailVerified`, and `authProvider` fields
- Maintains backward compatibility with existing user data

## Key Components
### Frontend
- `AuthForm`: Combined login/register form with tabs
- `UserProfile`: User dropdown with profile management and logout
- Updated `useAuth` hook for session-based authentication
- Integration with existing meal planning components

### Backend
- `AuthService`: Handles user registration, login, and password changes
- `authMiddleware`: Supports both email/password and OIDC authentication
- Authentication routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- Password management: `/api/auth/change-password`

## Recent Changes
- ✅ **January 21, 2025**: Updated consolidated ingredients design documentation to reflect complete implementation
  - Reviewed and updated CONSOLIDATED_INGREDIENTS_DESIGN.md with current feature status
  - Updated CONSOLIDATED_INGREDIENTS_FEATURES.md to show all 10 features as complete
  - Documented technical implementation details and achievements
  - Added completion timeline showing 4-week phased implementation
  - Updated success metrics to reflect achieved performance and user experience goals
  - Confirmed feature is fully operational with AI-powered store organization and Instacart integration
- ✅ **January 21, 2025**: Completed Phase 3 of recipe selection feature
  - Enhanced RecipeAssignmentGrid with bulk assignment functionality
  - Added advanced progress tracking and completion status indicators
  - Improved mobile responsiveness across all recipe selection components
  - Enhanced loading states with proper skeleton components
  - Added comprehensive filtering and search capabilities for recipe selection
  - Completed all major UX enhancements and mobile optimization
- ✅ **January 18, 2025**: Created feature design tracker for existing recipe integration
  - Analyzed current recipe and meal plan infrastructure
  - Designed comprehensive feature specification in RECIPE_SELECTION_FEATURE.md
  - Planned 3-week implementation roadmap with detailed milestones
  - Identified required UI components and API endpoints
  - Documented technical considerations and success metrics
- ✅ **January 18, 2025**: Rebranded from FoodGo to HealthyCart
  - Updated all UI components and branding elements
  - Changed application name throughout codebase
  - Updated HTML title and meta descriptions
  - Modified landing page and authentication forms
  - Updated project documentation and design files
- ✅ **January 18, 2025**: Fixed recipe data isolation issue
  - Created user-specific recipe system using userRecipes table
  - New users now start with empty recipe library
  - Added methods to add recipes to user libraries
  - Fixed duplicate recipe routes causing global access
  - Updated authentication to work with HTTP cookies
- ✅ **January 18, 2025**: Implemented custom email/password authentication
  - Added database schema for password authentication
  - Created AuthService with bcrypt password hashing
  - Built authentication middleware supporting both methods
  - Implemented login/register forms with validation
  - Added user profile component with password change
  - Updated existing components to use new authentication

## User Preferences
- Authentication method: Email/password (with future Google SSO support)
- Session-based authentication preferred over token-based
- Backward compatibility with existing authentication required
- Clean, modern UI with shadcn/ui components

## Next Steps

### Completed Features ✅
- **Recipe Integration Feature**: All 3 phases completed successfully
  - Phase 1: Recipe selection modal and assignment interface ✅
  - Phase 2: Backend API for mixed meal plan generation ✅ 
  - Phase 3: UX enhancements and mobile optimization ✅

### Future Enhancement Opportunities
- **Advanced Recipe Features**: Recipe rating system, user reviews, recipe variations
- **Meal Plan Optimization**: Smart ingredient substitutions, dietary constraint optimization
- **Social Features**: Recipe sharing, community meal plans, cooking tips

### Future Authentication Enhancements
- Future Google SSO integration planned
- Email verification system can be added
- Password reset functionality can be implemented
- Two-factor authentication can be added for enhanced security

## Feature Documentation
- **RECIPE_SELECTION_FEATURE.md**: Comprehensive design and implementation tracker for adding existing recipes to meal plans