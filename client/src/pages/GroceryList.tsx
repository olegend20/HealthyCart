import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Download, 
  Search, 
  ShoppingCart, 
  Check, 
  MapPin,
  DollarSign,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function GroceryList() {
  const [, params] = useRoute("/grocery-list/:id");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"category" | "aisle">("category");

  const groceryListId = params?.id ? parseInt(params.id) : null;

  const { data: groceryList, isLoading } = useQuery({
    queryKey: ["/api/grocery-lists", groceryListId],
    enabled: !!groceryListId,
  });

  // Type-safe access to grocery list data
  const groceryListData = groceryList as { name?: string; totalCost?: string; items?: any[] } | undefined;

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      await apiRequest("PUT", `/api/grocery-list-items/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-lists", groceryListId] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const toggleItemPurchased = (itemId: number, purchased: boolean) => {
    updateItemMutation.mutate({
      id: itemId,
      updates: { purchased }
    });
  };

  const handleDownload = () => {
    if (!groceryList) return;

    const content = generateGroceryListText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groceryListData?.name || 'grocery-list'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Grocery list downloaded successfully",
    });
  };

  const generateGroceryListText = () => {
    if (!groceryListData) return "";

    let content = `${groceryListData.name || 'Grocery List'}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n`;
    content += `Total Estimated Cost: $${parseFloat(groceryListData.totalCost || "0").toFixed(2)}\n\n`;

    const groupedItems = groupItemsBy(filteredItems, groupBy);
    
    Object.entries(groupedItems).forEach(([group, items]) => {
      content += `${group.toUpperCase()}\n`;
      content += "=" + "=".repeat(group.length - 1) + "\n";
      
      (items as any[]).forEach((item: any) => {
        const status = item.purchased ? "[✓]" : "[ ]";
        const amount = item.amount && item.unit ? ` (${item.amount} ${item.unit})` : "";
        const price = ` - $${parseFloat(item.estimatedPrice || "0").toFixed(2)}`;
        content += `${status} ${item.name}${amount}${price}\n`;
      });
      content += "\n";
    });

    return content;
  };

  if (!groceryListId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invalid Grocery List</h3>
            <p className="text-gray-600 mb-4">The grocery list ID is missing or invalid.</p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg">Loading grocery list...</p>
        </div>
      </div>
    );
  }

  if (!groceryListData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Grocery List Not Found</h3>
            <p className="text-gray-600 mb-4">The requested grocery list could not be found.</p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = groceryListData?.items || [];
  const filteredItems = items.filter((item: any) =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupItemsBy = (items: any[], groupBy: string) => {
    return items.reduce((groups: any, item: any) => {
      const key = groupBy === "category" 
        ? (item.category || "Other")
        : (item.aisle || "Other");
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  };

  const groupedItems = groupItemsBy(filteredItems, groupBy);
  const purchasedCount = items.filter((item: any) => item.purchased).length;
  const totalItems = items.length;
  const completionPercentage = totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-xl font-bold text-gray-900">{groceryListData?.name || 'Grocery List'}</h1>
          </div>
        </div>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download List
        </Button>
      </div>

      {/* Progress Card */}
      <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Shopping Progress</h3>
                <p className="text-gray-600">
                  {purchasedCount} of {totalItems} items completed
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-secondary">
                  {completionPercentage.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-secondary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Group by:</span>
                <div className="flex space-x-2">
                  <Button
                    variant={groupBy === "category" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGroupBy("category")}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Category
                  </Button>
                  <Button
                    variant={groupBy === "aisle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGroupBy("aisle")}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Aisle
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grocery Items */}
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <Card key={group}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{group}</span>
                  <Badge variant="outline">
                    {(groupItems as any[]).length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {(groupItems as any[]).map((item: any) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        item.purchased 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={item.purchased}
                          onCheckedChange={(checked) => 
                            toggleItemPurchased(item.id, checked as boolean)
                          }
                          className="w-5 h-5"
                          disabled={updateItemMutation.isPending}
                        />
                        <div>
                          <div className={`font-medium ${
                            item.purchased ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {item.name}
                          </div>
                          {item.amount && item.unit && (
                            <div className="text-sm text-gray-500">
                              {item.amount} {item.unit}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-sm text-gray-500 italic">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ${parseFloat(item.estimatedPrice || "0").toFixed(2)}
                        </div>
                        {groupBy === "category" && item.aisle && (
                          <div className="text-sm text-gray-500">
                            {item.aisle}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                <span className="text-lg font-semibold text-gray-900">
                  Total Estimated Cost:
                </span>
              </div>
              <span className="text-2xl font-bold text-secondary">
                ${parseFloat(groceryListData?.totalCost || "0").toFixed(2)}
              </span>
            </div>
            
            {purchasedCount === totalItems && totalItems > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Shopping Complete!</span>
                </div>
                <p className="text-green-700 mt-1">
                  You've checked off all items on your grocery list. Happy cooking!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
