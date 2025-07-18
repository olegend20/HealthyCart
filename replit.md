# FoodGo - AI-Powered Meal Planning Platform

## Overview
FoodGo is an advanced AI-powered meal planning platform that generates comprehensive weekly meal plans tailored to user preferences, dietary needs, and nutritional goals. The platform helps users save time and money through intelligent ingredient optimization and automated grocery list generation.

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
- Future Google SSO integration planned
- Email verification system can be added
- Password reset functionality can be implemented
- Two-factor authentication can be added for enhanced security