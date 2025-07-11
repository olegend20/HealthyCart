import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import CleanHome from "@/pages/CleanHome";
import HouseholdSetup from "@/pages/HouseholdSetup";
import MealPlanGenerator from "@/pages/MealPlanGenerator";
import GroceryList from "@/pages/GroceryList";
import FeatureTracker from "@/pages/FeatureTracker";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={CleanHome} />
          <Route path="/household-setup" component={HouseholdSetup} />
          <Route path="/meal-plan-generator" component={MealPlanGenerator} />
          <Route path="/grocery-list/:id" component={GroceryList} />
          <Route path="/feature-tracker" component={FeatureTracker} />
          <Route path="/recipes" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Recipes</h1><p>Recipe browsing coming soon!</p></div>} />
          <Route path="/grocery-lists" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Grocery Lists</h1><p>Grocery list management coming soon!</p></div>} />
        </>
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
