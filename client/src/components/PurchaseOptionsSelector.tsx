import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Bot, ArrowRight, ShoppingCart, Smartphone } from 'lucide-react';

interface PurchaseOptionsSelectorProps {
  onOptionSelect: (option: 'self' | 'ai') => void;
}

export function PurchaseOptionsSelector({ onOptionSelect }: PurchaseOptionsSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">How would you like to purchase these ingredients?</h3>
        <p className="text-gray-600">Choose your preferred shopping method</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Self Purchase Option */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 p-3 bg-blue-100 rounded-full w-fit">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Self Purchase</CardTitle>
            <CardDescription>Shop in-store with organized lists</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <ShoppingCart className="h-4 w-4 mr-2 text-green-500" />
                Organized by store aisles
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Store className="h-4 w-4 mr-2 text-green-500" />
                Choose your preferred grocery store
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ArrowRight className="h-4 w-4 mr-2 text-green-500" />
                Efficient shopping route
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => onOptionSelect('self')}
            >
              Choose Self Purchase
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* AI Purchase Option */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 p-3 bg-purple-100 rounded-full w-fit">
              <Bot className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-lg">AI Purchase</CardTitle>
            <CardDescription>Use ChatGPT with Instacart</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Smartphone className="h-4 w-4 mr-2 text-green-500" />
                Copy-paste format for ChatGPT
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Bot className="h-4 w-4 mr-2 text-green-500" />
                AI-powered Instacart integration
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ArrowRight className="h-4 w-4 mr-2 text-green-500" />
                Delivered to your door
              </div>
            </div>
            
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              onClick={() => onOptionSelect('ai')}
            >
              Choose AI Purchase
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-500">
        You can switch between options at any time
      </div>
    </div>
  );
}