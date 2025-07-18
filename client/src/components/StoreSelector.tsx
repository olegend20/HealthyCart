import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Store } from 'lucide-react';

const popularStores = [
  { value: 'walmart', label: 'Walmart', description: 'Everyday low prices' },
  { value: 'target', label: 'Target', description: 'Expect more, pay less' },
  { value: 'kroger', label: 'Kroger', description: 'Fresh for everyone' },
  { value: 'safeway', label: 'Safeway', description: 'Ingredients for life' },
  { value: 'whole-foods', label: 'Whole Foods Market', description: 'Quality standards' },
  { value: 'costco', label: 'Costco', description: 'Warehouse shopping' },
  { value: 'publix', label: 'Publix', description: 'Where shopping is a pleasure' },
  { value: 'heb', label: 'H-E-B', description: 'Here everything is better' },
  { value: 'trader-joes', label: "Trader Joe's", description: 'Unique finds' },
  { value: 'aldi', label: 'ALDI', description: 'Simply smarter shopping' }
];

interface StoreSelectorProps {
  onStoreSelect: (store: string) => void;
}

export function StoreSelector({ onStoreSelect }: StoreSelectorProps) {
  const [selectedStore, setSelectedStore] = useState<string>('');

  const handleStoreChange = (value: string) => {
    setSelectedStore(value);
    const store = popularStores.find(s => s.value === value);
    if (store) {
      onStoreSelect(store.label);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Store className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium">Select Your Grocery Store</h4>
          </div>
          
          <Select value={selectedStore} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a store for aisle organization..." />
            </SelectTrigger>
            <SelectContent>
              {popularStores.map((store) => (
                <SelectItem key={store.value} value={store.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{store.label}</span>
                    <span className="text-xs text-gray-500">{store.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedStore && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Organizing ingredients by {popularStores.find(s => s.value === selectedStore)?.label} layout
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}