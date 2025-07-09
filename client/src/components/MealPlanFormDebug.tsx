import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface MealPlanFormDebugProps {
  householdMembers: HouseholdMember[];
  onSuccess?: () => void;
}

export default function MealPlanFormDebug({ householdMembers, onSuccess }: MealPlanFormDebugProps) {
  console.log("MealPlanFormDebug render - householdMembers:", householdMembers?.length);
  
  const [formData, setFormData] = useState({
    name: '',
    selectedMembers: [] as number[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    onSuccess?.();
  };

  const handleMemberToggle = (memberId: number) => {
    console.log("Toggling member:", memberId);
    setFormData(prev => {
      const isSelected = prev.selectedMembers.includes(memberId);
      const newSelectedMembers = isSelected 
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId];
      
      console.log("New selected members:", newSelectedMembers);
      return {
        ...prev,
        selectedMembers: newSelectedMembers
      };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>Debug Meal Plan Form</span>
        </CardTitle>
        <CardDescription>
          Debugging the infinite loop issue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Meal Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                console.log("Name changed:", e.target.value);
                setFormData(prev => ({ ...prev, name: e.target.value }));
              }}
              placeholder="e.g., Family Week"
              required
            />
          </div>

          <div>
            <Label>Select Family Members (Click to Toggle)</Label>
            <div className="space-y-2 mt-2">
              {householdMembers?.map((member) => (
                <div
                  key={member.id}
                  className={`p-2 border rounded cursor-pointer ${
                    formData.selectedMembers.includes(member.id) 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleMemberToggle(member.id)}
                >
                  <span className="font-medium">{member.name}</span>
                  {formData.selectedMembers.includes(member.id) && (
                    <span className="text-blue-600 ml-2">✓</span>
                  )}
                </div>
              )) || <div>No household members found</div>}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Selected: {formData.selectedMembers.join(', ')}
          </div>

          <Button type="submit" className="w-full">
            Test Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}