import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Bot, Smartphone, ExternalLink, Edit3 } from 'lucide-react';
import type { ConsolidatedIngredient } from './ConsolidatedIngredientsModal';

interface InstacartFormatViewProps {
  ingredients: ConsolidatedIngredient[];
  formatData?: { format: string };
  isLoading: boolean;
  onCopy: (text: string) => void;
}

export function InstacartFormatView({ 
  ingredients, 
  formatData, 
  isLoading, 
  onCopy 
}: InstacartFormatViewProps) {
  const [editableFormat, setEditableFormat] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate fallback format if AI generation fails
  const fallbackFormat = `Please add these items to my Instacart cart:
${ingredients.map(item => `- ${item.totalAmount} ${item.unit} ${item.name}`).join('\n')}

If any items are unavailable, please suggest similar alternatives.
Prefer organic options when available.`;

  const displayFormat = formatData?.format || fallbackFormat;
  const currentFormat = isEditing ? editableFormat : displayFormat;

  const handleEdit = () => {
    setEditableFormat(displayFormat);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleCopy = async () => {
    await onCopy(currentFormat);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Bot className="h-8 w-8 animate-pulse text-purple-600" aria-hidden="true" />
            <div className="text-center">
              <div className="font-medium">Generating Instacart format...</div>
              <div className="text-sm text-gray-500 mt-2">
                Converting cooking measurements to grocery store units
              </div>
            </div>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <div className="font-medium">How to use with ChatGPT Instacart:</div>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Copy the formatted text below</li>
            <li>Open ChatGPT and find the Instacart integration</li>
            <li>Paste the text and send your message</li>
            <li>ChatGPT will add items to your Instacart cart</li>
          </ol>
          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-800">
              <strong>Smart Unit Conversion:</strong> Cooking measurements (cups, tablespoons) are automatically converted to grocery store units (packages, bottles, bags) for easy shopping.
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Format Display/Editor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Smartphone className="h-5 w-5 mr-2 text-purple-600" />
              Instacart Format
            </CardTitle>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleSaveEdit}>
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
              <Button onClick={handleCopy} disabled={!currentFormat}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editableFormat}
              onChange={(e) => setEditableFormat(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Edit your Instacart format..."
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {currentFormat}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ingredients Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {ingredients.length}
              </div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${ingredients.reduce((sum, ing) => sum + ing.estimatedPrice, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Est. Cost
                <div className="text-xs text-amber-600">*May vary</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(ingredients.flatMap(ing => ing.usedInPlans)).size}
              </div>
              <div className="text-sm text-gray-600">Meal Plans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(ingredients.map(ing => ing.category)).size}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Categories Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(ingredients.map(ing => ing.category))).map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium mb-1">Pro Tips:</div>
          <ul className="text-sm space-y-1">
            <li>• Measurements are converted to grocery store sizes (e.g., "2 cups flour" → "5 lb bag flour")</li>
            <li>• ChatGPT can suggest alternatives if items are unavailable</li>
            <li>• Ask for organic options when available</li>
            <li>• You can modify quantities before confirming the order</li>
            <li>• Double-check your delivery address in Instacart</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}