import { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ConsolidatedIngredient } from './ConsolidatedIngredientsModal';

interface PrintableShoppingListProps {
  ingredients: ConsolidatedIngredient[];
  organizedData?: { [aisle: string]: ConsolidatedIngredient[] };
  store: string;
  title: string;
}

export const PrintableShoppingList = forwardRef<HTMLDivElement, PrintableShoppingListProps>(
  ({ ingredients, organizedData, store, title }, ref) => {
    // Use organized data if available, otherwise group by category
    const displayData = organizedData || ingredients.reduce((acc, ingredient) => {
      const category = ingredient.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(ingredient);
      return acc;
    }, {} as { [key: string]: ConsolidatedIngredient[] });

    const totalCost = ingredients.reduce((sum, item) => sum + item.estimatedPrice, 0);
    const totalItems = ingredients.length;

    return (
      <div ref={ref} className="print-container bg-white p-8 space-y-6">
        <style>{`
          @media print {
            .print-container {
              margin: 0;
              padding: 20px;
              background: white !important;
              color: black !important;
            }
            @page {
              margin: 1in;
              size: portrait;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>
        
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <div className="text-lg text-gray-600">
            {store} Shopping List
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {totalItems} items • Estimated cost: ${totalCost.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Generated on {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Shopping Progress */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="border rounded p-3">
            <div className="font-bold text-lg">Total Items</div>
            <div className="text-2xl text-blue-600">{totalItems}</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-bold text-lg">Estimated Cost</div>
            <div className="text-2xl text-green-600">${totalCost.toFixed(2)}</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-bold text-lg">Store Sections</div>
            <div className="text-2xl text-purple-600">{Object.keys(displayData).length}</div>
          </div>
        </div>

        {/* Organized Shopping List */}
        <div className="space-y-6">
          {Object.entries(displayData).map(([section, sectionIngredients]) => (
            <div key={section} className="border rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-xl font-semibold flex items-center justify-between">
                  {section}
                  <Badge variant="secondary">{sectionIngredients.length} items</Badge>
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  {sectionIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border border-gray-400"></div>
                        <div>
                          <span className="font-medium">
                            {ingredient.totalAmount} {ingredient.unit} {ingredient.name}
                          </span>
                          {ingredient.usedInPlans.length > 1 && (
                            <div className="text-xs text-gray-500">
                              Used in: {ingredient.usedInPlans.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        ${ingredient.estimatedPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Notes */}
        <div className="border-t pt-4 space-y-2">
          <div className="text-sm text-gray-600">
            <strong>Shopping Tips:</strong>
          </div>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Check each item off as you collect it</li>
            <li>• Follow the sections in order for efficient shopping</li>
            <li>• Consider organic options when available</li>
            <li>• Check expiration dates, especially for produce and dairy</li>
            <li>• Bring reusable bags for environmental impact</li>
          </ul>
        </div>
      </div>
    );
  }
);

PrintableShoppingList.displayName = 'PrintableShoppingList';