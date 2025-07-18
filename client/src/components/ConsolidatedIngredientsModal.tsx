import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Store, Bot, Loader2, Copy, Check, Download, ArrowLeft, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PurchaseOptionsSelector } from './PurchaseOptionsSelector';
import { StoreSelector } from './StoreSelector';
import { AisleOrganizedView } from './AisleOrganizedView';
import { InstacartFormatView } from './InstacartFormatView';
import { PrintableShoppingList } from './PrintableShoppingList';
import { apiRequest } from '@/lib/queryClient';

export interface ConsolidatedIngredient {
  name: string;
  totalAmount: number;
  unit: string;
  category: string;
  estimatedPrice: number;
  usedInPlans: string[];
  aisle?: string;
}

export interface ConsolidatedIngredientsResponse {
  id: string;
  name: string;
  totalCost: number;
  ingredients: ConsolidatedIngredient[];
  metadata: {
    mealPlanCount: number;
    recipeCount: number;
    totalItems: number;
  };
}

interface ConsolidatedIngredientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlanId?: number;
  groupId?: number;
  title?: string;
}

type PurchaseOption = 'options' | 'self' | 'ai';

export function ConsolidatedIngredientsModal({
  isOpen,
  onClose,
  mealPlanId,
  groupId,
  title
}: ConsolidatedIngredientsModalProps) {
  const [currentView, setCurrentView] = useState<PurchaseOption>('options');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [printRef, setPrintRef] = useState<HTMLDivElement | null>(null);
  const [excludedIngredients, setExcludedIngredients] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch consolidated ingredients
  const { data: consolidatedData, isLoading, error } = useQuery({
    queryKey: mealPlanId 
      ? ['/api/consolidated-ingredients/meal-plan', mealPlanId] 
      : ['/api/consolidated-ingredients/group', groupId],
    enabled: isOpen && (!!mealPlanId || !!groupId)
  });

  // Store organization mutation
  const organizeByStoreMutation = useMutation({
    mutationFn: async ({ ingredients, store }: { ingredients: ConsolidatedIngredient[], store: string }) => {
      const response = await apiRequest('POST', '/api/consolidated-ingredients/organize-by-store', { ingredients, store });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Store organization complete",
        description: "Ingredients organized by store aisles"
      });
    },
    onError: () => {
      toast({
        title: "Organization failed",
        description: "Could not organize by store. Using category fallback.",
        variant: "destructive"
      });
    }
  });

  // Instacart format mutation
  const instacartFormatMutation = useMutation({
    mutationFn: async (ingredients: ConsolidatedIngredient[]) => {
      const response = await apiRequest('POST', '/api/consolidated-ingredients/instacart-format', { ingredients });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Instacart format generated",
        description: "Ready to copy and paste into ChatGPT"
      });
    },
    onError: () => {
      toast({
        title: "Format generation failed",
        description: "Could not generate Instacart format",
        variant: "destructive"
      });
    }
  });

  const handleStoreSelection = async (store: string) => {
    setSelectedStore(store);
    if (consolidatedData?.ingredients) {
      await organizeByStoreMutation.mutateAsync({
        ingredients: getFilteredIngredients(),
        store
      });
    }
  };

  const handleInstacartGeneration = async () => {
    if (consolidatedData?.ingredients) {
      await instacartFormatMutation.mutateAsync(getFilteredIngredients());
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Ready to paste into ChatGPT"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (printRef) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Shopping List - ${consolidatedData?.name || 'Consolidated Ingredients'}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                @media print {
                  body { margin: 0; }
                  @page { margin: 1in; }
                }
              </style>
            </head>
            <body>
              ${printRef.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  const handleToggleIngredient = (ingredientKey: string) => {
    setExcludedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientKey)) {
        newSet.delete(ingredientKey);
      } else {
        newSet.add(ingredientKey);
      }
      return newSet;
    });
  };

  const getFilteredIngredients = () => {
    if (!consolidatedData?.ingredients) return [];
    return consolidatedData.ingredients.filter(ingredient => {
      const ingredientKey = `${ingredient.name}-${ingredient.unit}`;
      return !excludedIngredients.has(ingredientKey);
    });
  };

  const getFilteredTotalCost = () => {
    const filteredIngredients = getFilteredIngredients();
    return filteredIngredients.reduce((total, ingredient) => total + ingredient.estimatedPrice, 0);
  };

  const generateDownloadContent = () => {
    if (!consolidatedData?.ingredients) return '';
    
    let content = `${consolidatedData.name}\n`;
    content += `Total Cost: $${consolidatedData.totalCost.toFixed(2)}\n`;
    content += `Items: ${consolidatedData.metadata.totalItems}\n\n`;
    
    // Group by category
    const groupedIngredients = consolidatedData.ingredients.reduce((acc, ingredient) => {
      const category = ingredient.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(ingredient);
      return acc;
    }, {} as Record<string, ConsolidatedIngredient[]>);

    Object.entries(groupedIngredients).forEach(([category, ingredients]) => {
      content += `${category}:\n`;
      ingredients.forEach(ingredient => {
        content += `  - ${ingredient.totalAmount} ${ingredient.unit} ${ingredient.name}\n`;
      });
      content += '\n';
    });

    return content;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Loading consolidated ingredients...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Error Loading Ingredients</h3>
            <p className="text-gray-600 mb-4">Could not load consolidated ingredients.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!consolidatedData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="h-6 w-6 mr-2" />
              {title || consolidatedData.name}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(generateDownloadContent(), 'shopping-list.txt')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                ${getFilteredTotalCost().toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Total Cost
                {excludedIngredients.size > 0 && (
                  <span className="text-xs text-gray-500 block">
                    (${consolidatedData.totalCost.toFixed(2)} originally)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">
                {getFilteredIngredients().length}
              </div>
              <div className="text-sm text-gray-600">
                Shopping Items
                {excludedIngredients.size > 0 && (
                  <span className="text-xs text-gray-500 block">
                    ({consolidatedData.metadata.totalItems} originally)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">
                {consolidatedData.metadata.mealPlanCount}
              </div>
              <div className="text-sm text-gray-600">Meal Plans</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">
                {consolidatedData.metadata.recipeCount}
              </div>
              <div className="text-sm text-gray-600">Recipes</div>
            </CardContent>
          </Card>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-6 pr-4">
            {/* Always show ingredients list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Consolidated Ingredients List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consolidatedData.ingredients.map((ingredient, index) => {
                    const ingredientKey = `${ingredient.name}-${ingredient.unit}`;
                    const isExcluded = excludedIngredients.has(ingredientKey);
                    
                    return (
                      <div key={index} className={`flex items-center justify-between border-b pb-2 transition-opacity ${isExcluded ? 'opacity-50' : ''}`}>
                        <div className="flex items-center space-x-3 flex-1">
                          <Button
                            variant={isExcluded ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleIngredient(ingredientKey)}
                            className={`text-xs ${isExcluded ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-100'}`}
                          >
                            {isExcluded ? 'Have it' : 'I have this'}
                          </Button>
                          <div className="flex-1">
                            <span className={`font-medium ${isExcluded ? 'line-through text-gray-500' : ''}`}>
                              {ingredient.totalAmount} {ingredient.unit} {ingredient.name}
                            </span>
                            {ingredient.usedInPlans.length > 1 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Used in: {ingredient.usedInPlans.join(', ')}
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs ml-2">
                              {ingredient.category}
                            </Badge>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${isExcluded ? 'line-through text-gray-500' : 'text-gray-600'}`}>
                          ${ingredient.estimatedPrice.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  
                  {excludedIngredients.size > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Items you already have: {excludedIngredients.size}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExcludedIngredients(new Set())}
                          className="text-xs"
                        >
                          Reset all
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          {/* Purchase options */}
          {currentView === 'options' && (
            <div className="space-y-4">
              <Separator />
              <PurchaseOptionsSelector onOptionSelect={setCurrentView} />
            </div>
          )}

          {currentView === 'self' && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('options')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Purchase Options</span>
                </Button>
                <div className="flex items-center space-x-3">
                  {selectedStore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print List
                    </Button>
                  )}
                  <StoreSelector onStoreSelect={handleStoreSelection} />
                </div>
              </div>

              {selectedStore && (
                <>
                  <AisleOrganizedView
                    ingredients={getFilteredIngredients()}
                    store={selectedStore}
                    organizedData={organizeByStoreMutation.data}
                    isLoading={organizeByStoreMutation.isPending}
                  />
                  
                  {/* Hidden printable version */}
                  <div style={{ display: 'none' }}>
                    <PrintableShoppingList
                      ref={setPrintRef}
                      ingredients={getFilteredIngredients()}
                      organizedData={organizeByStoreMutation.data}
                      store={selectedStore}
                      title={consolidatedData.name}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {currentView === 'ai' && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('options')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Purchase Options</span>
                </Button>
                <Button 
                  onClick={handleInstacartGeneration}
                  disabled={instacartFormatMutation.isPending}
                >
                  {instacartFormatMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Generate Instacart Format
                    </>
                  )}
                </Button>
              </div>

              <InstacartFormatView
                ingredients={getFilteredIngredients()}
                formatData={instacartFormatMutation.data}
                isLoading={instacartFormatMutation.isPending}
                onCopy={handleCopyToClipboard}
              />
            </div>
          )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}