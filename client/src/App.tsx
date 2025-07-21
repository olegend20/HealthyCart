import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthForm from "@/components/AuthForm";
import Layout from "@/components/Layout";
import CleanHome from "@/pages/CleanHome";
import HouseholdSetup from "@/pages/HouseholdSetup";
import MealPlanGenerator from "@/pages/MealPlanGenerator";
import MultiMealPlanGenerator from "@/pages/MultiMealPlanGenerator";
import MealPlanDetails from "@/pages/MealPlanDetails";
import MealPlanGroupDetails from "@/pages/MealPlanGroupDetails";
import GroceryList from "@/pages/GroceryList";
import FeatureTracker from "@/pages/FeatureTracker";
import RecipeLibrary from "@/pages/RecipeLibrary";
import RecipeCustomizer from "@/pages/RecipeCustomizer";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={AuthForm} />
      ) : (
        <Layout>
          <Route path="/" component={CleanHome} />
          <Route path="/household-setup" component={HouseholdSetup} />
          <Route path="/meal-plan-generator" component={MealPlanGenerator} />
          <Route path="/multi-meal-plan-generator" component={MultiMealPlanGenerator} />
          <Route path="/meal-plan/:id" component={MealPlanDetails} />
          <Route path="/meal-plan-group/:groupId" component={MealPlanGroupDetails} />
          <Route path="/grocery-list/:id" component={GroceryList} />
          <Route path="/feature-tracker" component={FeatureTracker} />
          <Route path="/recipes" component={RecipeLibrary} />
          <Route path="/recipe/:id/customize" component={RecipeCustomizer} />
          <Route path="/grocery-lists" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Grocery Lists</h1><p>Grocery list management coming soon!</p></div>} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
