import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, MapPin, ShoppingCart, CheckCircle2 } from 'lucide-react';
import type { ConsolidatedIngredient } from './ConsolidatedIngredientsModal';

interface AisleOrganizedViewProps {
  ingredients: ConsolidatedIngredient[];
  store: string;
  organizedData?: { [aisle: string]: ConsolidatedIngredient[] };
  isLoading: boolean;
}

export function AisleOrganizedView({ 
  ingredients, 
  store, 
  organizedData, 
  isLoading 
}: AisleOrganizedViewProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Fallback organization by category if AI organization failed
  const fallbackOrganization = ingredients.reduce((acc, ingredient) => {
    const aisle = getCategoryAisle(ingredient.category);
    if (!acc[aisle]) acc[aisle] = [];
    acc[aisle].push(ingredient);
    return acc;
  }, {} as { [aisle: string]: ConsolidatedIngredient[] });

  const displayData = organizedData || fallbackOrganization;
  const totalItems = ingredients.length;
  const checkedCount = checkedItems.size;
  const progressPercentage = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const handleItemCheck = (itemKey: string, checked: boolean) => {
    const newCheckedItems = new Set(checkedItems);
    if (checked) {
      newCheckedItems.add(itemKey);
    } else {
      newCheckedItems.delete(itemKey);
    }
    setCheckedItems(newCheckedItems);
  };

  const getItemKey = (ingredient: ConsolidatedIngredient, aisle: string) => {
    return `${aisle}-${ingredient.name}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            <span>Organizing ingredients by {store} store layout...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                {store} Shopping List
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Organized by store aisles for efficient shopping
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {checkedCount}/{totalItems}
              </div>
              <div className="text-sm text-gray-600">Items Collected</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Shopping Progress</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Aisle Organization */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {Object.entries(displayData).map(([aisle, aisleIngredients]) => {
            const aisleCheckedCount = aisleIngredients.filter(ingredient => 
              checkedItems.has(getItemKey(ingredient, aisle))
            ).length;
            const aisleTotal = aisleIngredients.length;
            const aisleComplete = aisleCheckedCount === aisleTotal;

            return (
              <Card key={aisle} className={aisleComplete ? 'border-green-200 bg-green-50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        aisleComplete ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {aisleComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{aisle}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {aisleCheckedCount}/{aisleTotal} items collected
                        </p>
                      </div>
                    </div>
                    <Badge variant={aisleComplete ? 'default' : 'secondary'}>
                      {aisleComplete ? 'Complete' : `${aisleTotal} items`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {aisleIngredients.map((ingredient, index) => {
                      const itemKey = getItemKey(ingredient, aisle);
                      const isChecked = checkedItems.has(itemKey);
                      
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <Checkbox
                            id={itemKey}
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handleItemCheck(itemKey, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <div className={`flex items-center justify-between ${
                              isChecked ? 'line-through text-gray-500' : ''
                            }`}>
                              <div>
                                <span className="font-medium">
                                  {ingredient.totalAmount} {ingredient.unit} {ingredient.name}
                                </span>
                                {ingredient.usedInPlans.length > 1 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Used in: {ingredient.usedInPlans.join(', ')}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-gray-600">
                                ${ingredient.estimatedPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Summary */}
      {checkedCount > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">
                  Great progress! {checkedCount} items collected
                </span>
              </div>
              <span className="text-green-700">
                {(progressPercentage).toFixed(0)}% complete
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to map categories to aisles (fallback)
function getCategoryAisle(category: string): string {
  const aisleMap: { [key: string]: string } = {
    'produce': 'Produce',
    'vegetables': 'Produce', 
    'fruits': 'Produce',
    'meat': 'Meat & Seafood',
    'seafood': 'Meat & Seafood',
    'poultry': 'Meat & Seafood',
    'dairy': 'Dairy',
    'cheese': 'Dairy',
    'milk': 'Dairy',
    'pantry': 'Pantry/Dry Goods',
    'grains': 'Pantry/Dry Goods',
    'pasta': 'Pantry/Dry Goods',
    'rice': 'Pantry/Dry Goods',
    'spices': 'Pantry/Dry Goods',
    'condiments': 'Pantry/Dry Goods',
    'frozen': 'Frozen',
    'bakery': 'Bakery',
    'bread': 'Bakery'
  };

  return aisleMap[category.toLowerCase()] || 'Other';
}