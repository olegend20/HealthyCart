import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ShoppingCart } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MealPlan {
  id: number;
  name: string;
}

interface GroceryListCardProps {
  mealPlan?: MealPlan;
}

export default function GroceryListCard({ mealPlan }: GroceryListCardProps) {
  const { data: groceryLists, isLoading } = useQuery({
    queryKey: ["/api/grocery-lists/meal-plan", mealPlan?.id],
    enabled: !!mealPlan?.id,
  });

  const currentGroceryList = groceryLists?.[0];

  const { data: groceryListDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/grocery-lists", currentGroceryList?.id],
    enabled: !!currentGroceryList?.id,
  });

  if (!mealPlan) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Grocery List</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p>Create a meal plan to generate your grocery list</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || detailsLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Grocery List</CardTitle>
            <LoadingSpinner size="sm" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = groceryListDetails?.items || [];
  const displayItems = items.slice(0, 4); // Show first 4 items

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Grocery List</CardTitle>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {items.length > 0 ? (
          <>
            <div className="space-y-3">
              {displayItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      checked={item.purchased}
                      className="w-4 h-4"
                    />
                    <span className={`text-sm ${item.purchased ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.name} {item.amount && item.unit && `(${item.amount} ${item.unit})`}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ${parseFloat(item.estimatedPrice || "0").toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            {items.length > 4 && (
              <div className="text-center text-sm text-gray-500 mt-4">
                +{items.length - 4} more items
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${parseFloat(groceryListDetails?.totalCost || "0").toFixed(2)}
                </span>
              </div>
            </div>
            
            <Button className="w-full mt-4 bg-primary text-white hover:bg-primary/90">
              View Full List
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p>No grocery list available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
