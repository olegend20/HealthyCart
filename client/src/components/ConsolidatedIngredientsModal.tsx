import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Store, Bot, Loader2, Copy, Check, Download, ArrowLeft, Printer, Keyboard, X } from 'lucide-react';
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
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

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    // Don't handle if user is typing in an input/textarea
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        if (currentView !== 'options') {
          setCurrentView('options');
        } else {
          onClose();
        }
        break;
      case '1':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setCurrentView('self');
          toast({ title: "Switched to Self Purchase", description: "Ctrl/Cmd + 1" });
        }
        break;
      case '2':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          setCurrentView('ai');
          if (consolidatedData?.ingredients) {
            handleInstacartGeneration();
          }
          toast({ title: "Switched to AI Purchase", description: "Ctrl/Cmd + 2" });
        }
        break;
      case 'd':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleDownload(generateDownloadContent(), 'shopping-list.txt');
          toast({ title: "Downloaded shopping list", description: "Ctrl/Cmd + D" });
        }
        break;
      case 'p':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handlePrint();
          toast({ title: "Print initiated", description: "Ctrl/Cmd + P" });
        }
        break;
      case '?':
        if (event.shiftKey) {
          event.preventDefault();
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
        }
        break;
    }
  }, [isOpen, currentView, onClose, consolidatedData, handleInstacartGeneration, handleDownload, generateDownloadContent, handlePrint, showKeyboardShortcuts, toast]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Load user preferences from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedStore = localStorage.getItem('consolidatedIngredients.preferredStore');
      const savedView = localStorage.getItem('consolidatedIngredients.preferredView') as PurchaseOption;
      
      if (savedStore) {
        setSelectedStore(savedStore);
      }
      if (savedView && ['options', 'self', 'ai'].includes(savedView)) {
        setCurrentView(savedView);
      }
    }
  }, [isOpen]);

  // Save user preferences to localStorage
  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem('consolidatedIngredients.preferredStore', selectedStore);
    }
  }, [selectedStore]);

  useEffect(() => {
    if (currentView !== 'options') {
      localStorage.setItem('consolidatedIngredients.preferredView', currentView);
    }
  }, [currentView]);



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
        <DialogContent className="max-w-4xl max-h-[90vh]" role="dialog" aria-labelledby="loading-title">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" aria-hidden="true" />
            <span id="loading-title">Loading consolidated ingredients...</span>
          </div>
          <div className="text-center text-sm text-gray-500 mt-4">
            <div className="space-y-2">
              <div>• Consolidating ingredients from multiple recipes</div>
              <div>• Calculating quantities and costs</div>
              <div>• Organizing by categories</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]" role="dialog" aria-labelledby="error-title">
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X className="h-8 w-8 text-red-600" aria-hidden="true" />
              </div>
              <h3 id="error-title" className="text-lg font-semibold mb-2">Error Loading Ingredients</h3>
              <p className="text-gray-600 mb-4">
                Could not load consolidated ingredients. This might be due to:
              </p>
              <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
                <li>• Network connectivity issues</li>
                <li>• Meal plan data not available</li>
                <li>• Server processing error</li>
              </ul>
            </div>
            <div className="space-x-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                aria-label="Refresh page to retry"
              >
                Try Again
              </Button>
              <Button onClick={onClose} aria-label="Close dialog">
                Close
              </Button>
            </div>
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
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                title="Show keyboard shortcuts (Shift + ?)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(generateDownloadContent(), 'shopping-list.txt')}
                title="Download shopping list (Ctrl/Cmd + D)"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 flex-shrink-0">
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

        {/* Keyboard Shortcuts Help */}
        {showKeyboardShortcuts && (
          <Card className="border-blue-200 bg-blue-50 flex-shrink-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Keyboard className="h-4 w-4 mr-2" />
                  Keyboard Shortcuts
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeyboardShortcuts(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + 1</span>
                  <span>Self Purchase</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + 2</span>
                  <span>AI Purchase</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + D</span>
                  <span>Download List</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl/Cmd + P</span>
                  <span>Print List</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Escape</span>
                  <span>Back/Close</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Shift + ?</span>
                  <span>Show Shortcuts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                            className={`text-xs transition-colors ${
                              isExcluded 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                                : 'border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400'
                            }`}
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
                          className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
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