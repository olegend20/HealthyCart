import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Utensils, Bell } from "lucide-react";
import UserProfile from "@/components/UserProfile";

export default function Header() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-xl font-bold text-gray-900">HealthyCart</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={isActive("/") ? "text-primary font-medium" : "text-gray-500 hover:text-gray-700"}
            >
              Meal Plans
            </Link>
            <Link 
              href="/recipes" 
              className={isActive("/recipes") ? "text-primary font-medium" : "text-gray-500 hover:text-gray-700"}
            >
              Recipes
            </Link>
            <Link 
              href="/grocery-lists" 
              className={isActive("/grocery-lists") ? "text-primary font-medium" : "text-gray-500 hover:text-gray-700"}
            >
              Grocery Lists
            </Link>
            <Link 
              href="/household-setup" 
              className={isActive("/household-setup") ? "text-primary font-medium" : "text-gray-500 hover:text-gray-700"}
            >
              Profile
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}