import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, DollarSign, Users, Clock, Leaf, ShoppingCart } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Utensils className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900">FoodGo</h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Meal Planning
            <span className="block text-primary">Made Simple</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Save time and money with AI-powered meal planning that optimizes ingredients, 
            accommodates dietary needs, and creates perfect grocery lists for your family.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Start Planning Your Meals
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Smart Meal Planning
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              FoodGo uses artificial intelligence to create optimized meal plans that save you time and money
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Family-Friendly Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create profiles for each family member with their dietary restrictions, preferences, and allergies. 
                  Get meals that work for everyone.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Ingredient Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-powered ingredient overlap maximization reduces food waste and grocery costs while maintaining 
                  nutritional variety.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Utensils className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Equipment Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Input your cooking equipment like slow cookers and instant pots. Get recipes optimized for 
                  the tools you actually own.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Hidden Vegetables</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Special feature for parents: get meal suggestions that cleverly incorporate vegetables in 
                  kid-friendly ways.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Smart Grocery Lists</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically generated grocery lists organized by store sections with cost estimates. 
                  Never forget an ingredient again.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Time-Saving Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate complete weekly meal plans in minutes, not hours. Spend more time cooking and 
                  less time planning.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Meal Planning?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of families who are saving time and money with smart meal planning.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Utensils className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold text-gray-900">FoodGo</span>
            </div>
            <p className="text-sm text-gray-600">
              Smart meal planning that saves time and money while keeping your family healthy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
