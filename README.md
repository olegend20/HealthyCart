# HealthyCart 🥗

**AI-Powered Meal Planning Platform**

HealthyCart is an advanced meal planning application that generates comprehensive weekly meal plans tailored to user preferences, dietary needs, and nutritional goals. The platform helps users save time and money through intelligent ingredient optimization and automated grocery list generation.

## ✨ Key Features

### 🎯 AI-Powered Meal Planning
- **Smart Meal Generation**: OpenAI GPT-4o integration for personalized meal plans
- **Dietary Preferences**: Support for various dietary restrictions and preferences  
- **Nutritional Goals**: Customizable nutrition targets and tracking
- **Recipe Customization**: AI-powered recipe modifications and suggestions

### 🛒 Intelligent Shopping Experience
- **Consolidated Ingredients**: Smart ingredient aggregation across multiple meal plans
- **Dual Shopping Workflows**: Choose between Self Purchase (in-store) or AI Purchase (Instacart)
- **Store Aisle Organization**: AI-powered grocery list organization for 9 major retail chains
- **Smart Unit Conversion**: Automatic conversion from cooking measurements to grocery store units
- **Shopping Progress Tracking**: Interactive checkboxes and completion progress

### 🏠 Household Management
- **Multi-Member Households**: Support for multiple household members with individual preferences
- **Meal Plan Groups**: Organize and manage multiple meal plans simultaneously
- **Recipe Libraries**: Personal recipe collections with search and filtering
- **Recipe Assignment**: Flexible recipe selection and assignment to meal plans

### 🔒 Secure Authentication
- **Email/Password Authentication**: Secure user accounts with bcrypt password hashing
- **Session Management**: PostgreSQL-backed session storage
- **User Profiles**: Avatar support and profile customization
- **Backward Compatibility**: Supports existing authentication systems

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** + **shadcn/ui** for modern, accessible UI components
- **Wouter** for client-side routing
- **TanStack Query** for efficient data fetching and caching
- **Framer Motion** for smooth animations

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database with **Drizzle ORM**
- **OpenAI GPT-4o** integration for AI-powered features
- **Session-based authentication** with Express sessions

### Key Technologies
- **Database**: PostgreSQL with Drizzle ORM and type-safe queries
- **AI Integration**: OpenAI GPT-4o for meal planning and ingredient organization
- **UI Framework**: shadcn/ui with Radix UI primitives
- **Form Management**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design system

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/olegend20/HealthyCart.git
   cd HealthyCart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   SESSION_SECRET=your_session_secret
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 📱 Core Features Overview

### Meal Planning
- **Multi-Plan Generation**: Create multiple meal plans for different weeks or purposes
- **Recipe Integration**: Add existing recipes to meal plans with bulk assignment
- **Nutritional Analysis**: Track calories, macros, and dietary goals
- **Meal Customization**: Modify recipes and serving sizes

### Shopping Lists
- **Consolidated Ingredients**: Automatically combine ingredients from multiple recipes
- **Store Organization**: AI-powered aisle organization for major grocery chains:
  - Walmart, Target, Kroger, Safeway, Whole Foods
  - Costco, Publix, H-E-B, Trader Joe's, ALDI
- **Instacart Integration**: Copy-paste ready format for ChatGPT Instacart ordering
- **Print-Friendly**: Optimized layouts for printing shopping lists

### Recipe Management
- **Personal Libraries**: Build and organize your recipe collections
- **Search & Filter**: Find recipes by ingredients, dietary preferences, or cuisine
- **Recipe Assignment**: Flexible system for adding recipes to meal plans
- **Progress Tracking**: Visual indicators for recipe completion status

### Household Features
- **Member Management**: Add household members with individual preferences
- **Dietary Restrictions**: Track allergies, preferences, and nutritional goals
- **Shared Meal Plans**: Collaborate on family meal planning

## 🔧 Development

### Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
├── server/              # Express backend
│   ├── services/        # Business logic services
│   ├── routes.ts        # API route definitions
│   └── auth.ts          # Authentication logic
├── shared/              # Shared types and schemas
└── Design_Documents/    # Feature specifications
```

### Key Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

### Database Management
The application uses Drizzle ORM for type-safe database operations. Schema changes should be made in `shared/schema.ts` and applied using:

```bash
npm run db:push
```

## 🌟 Advanced Features

### AI-Powered Capabilities
- **Intelligent Meal Generation**: Context-aware meal planning based on preferences
- **Store Layout Optimization**: AI organizes shopping lists by actual store layouts
- **Unit Conversion**: Smart conversion from recipe measurements to grocery quantities
- **Recipe Suggestions**: AI-powered recipe recommendations

### Performance Optimizations
- **Intelligent Caching**: Store layout and ingredient data caching
- **Efficient Algorithms**: Map-based ingredient consolidation
- **Optimized Queries**: Database queries optimized with Drizzle ORM
- **Loading States**: Comprehensive loading and skeleton states

### Error Handling
- **Graceful Degradation**: Fallback mechanisms for AI service failures
- **User-Friendly Messages**: Clear error messages with actionable guidance
- **Comprehensive Validation**: Input validation with Zod schemas

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Password management

### Meal Planning Endpoints
- `GET /api/meal-plans` - Get user meal plans
- `POST /api/meal-plans` - Create new meal plan
- `GET /api/meal-plans/:id` - Get specific meal plan details

### Consolidated Ingredients Endpoints
- `GET /api/consolidated-ingredients/meal-plan/:id` - Get consolidated ingredients
- `POST /api/consolidated-ingredients/organize-by-store` - AI store organization
- `POST /api/consolidated-ingredients/instacart-format` - Generate Instacart format

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

## 🎯 Future Roadmap

- **Direct Instacart API Integration**: When officially available
- **Additional Delivery Services**: DoorDash, Uber Eats, Amazon Fresh
- **Store Inventory Integration**: Real-time availability checking
- **Price Comparison**: Multi-store price analysis
- **Nutrition Tracking**: Advanced dietary analytics
- **Social Features**: Recipe sharing and community meal plans

---

**HealthyCart** - Making meal planning intelligent, efficient, and enjoyable! 🌟