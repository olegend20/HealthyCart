import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Users, Baby, Heart, ChefHat } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/utils';

interface MealPlan {
  id: string;
  name: string;
  targetGroup: 'adults' | 'kids' | 'family' | 'dietary';
  selectedMembers: number[];
  goals: string[];
  mealTypes: string[];
  duration: number;
  mealCount: number;
  budget?: number;
  startDate: string;
  includeExistingRecipes?: boolean;
}

interface MultiMealPlanFormProps {
  onSuccess?: () => void;
}

const TARGET_GROUP_OPTIONS = [
  { value: 'adults', label: 'Adults Only', icon: Users },
  { value: 'kids', label: 'Kids Only', icon: Baby }, 
  { value: 'family', label: 'Whole Family', icon: Users },
  { value: 'dietary', label: 'Special Dietary', icon: Heart }
];

const GOAL_OPTIONS = [
  'Reduced calories',
  'Higher protein', 
  'Quick meal prep',
  'Increased vegetables',
  'Budget-friendly',
  'Heart-healthy',
  'Low-carb',
  'Family-friendly recipes',
  'Meal prep friendly',
  'Gluten-free options',
  'Kid-friendly',
  'Hidden vegetables',
  'Finger foods',
  'Nutritious snacks'
];

const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' }
];

export function MultiMealPlanForm({ onSuccess }: MultiMealPlanFormProps) {
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [includeExistingRecipes, setIncludeExistingRecipes] = useState(false);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([
    {
      id: '1',
      name: 'Adult Meal Plan',
      targetGroup: 'adults',
      selectedMembers: [],
      goals: ['Family-friendly recipes'],
      mealTypes: ['dinner'],
      duration: 7,
      mealCount: 5,
      startDate: new Date().toISOString().split('T')[0],
      includeExistingRecipes: false
    }
  ]);

  const { data: householdMembers = [] } = useQuery({
    queryKey: ['/api/household-members']
  });

  const generateMultiMealPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/meal-plans/generate-multi', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] });
      toast({
        title: 'Success!',
        description: `Generated ${data.mealPlans.length} meal plans with optimized ingredients.`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate meal plans. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const addMealPlan = () => {
    const newPlan: MealPlan = {
      id: Date.now().toString(),
      name: `Meal Plan ${mealPlans.length + 1}`,
      targetGroup: 'family',
      selectedMembers: [],
      goals: ['Family-friendly recipes'],
      mealTypes: ['dinner'],
      duration: 7,
      mealCount: 5,
      startDate: new Date().toISOString().split('T')[0]
    };
    setMealPlans([...mealPlans, newPlan]);
  };

  const removeMealPlan = (id: string) => {
    if (mealPlans.length > 1) {
      setMealPlans(mealPlans.filter(plan => plan.id !== id));
    }
  };

  const updateMealPlan = (id: string, updates: Partial<MealPlan>) => {
    setMealPlans(mealPlans.map(plan => 
      plan.id === id ? { ...plan, ...updates } : plan
    ));
  };

  const toggleGoal = (planId: string, goal: string) => {
    const plan = mealPlans.find(p => p.id === planId);
    if (!plan) return;

    const updatedGoals = plan.goals.includes(goal)
      ? plan.goals.filter(g => g !== goal)
      : [...plan.goals, goal];

    updateMealPlan(planId, { goals: updatedGoals });
  };

  const toggleMealType = (planId: string, mealType: string) => {
    const plan = mealPlans.find(p => p.id === planId);
    if (!plan) return;

    const updatedMealTypes = plan.mealTypes.includes(mealType)
      ? plan.mealTypes.filter(mt => mt !== mealType)
      : [...plan.mealTypes, mealType];

    updateMealPlan(planId, { mealTypes: updatedMealTypes });
  };

  const toggleMember = (planId: string, memberId: number) => {
    const plan = mealPlans.find(p => p.id === planId);
    if (!plan) return;

    const updatedMembers = plan.selectedMembers.includes(memberId)
      ? plan.selectedMembers.filter(id => id !== memberId)
      : [...plan.selectedMembers, memberId];

    updateMealPlan(planId, { selectedMembers: updatedMembers });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a group name for your meal plans.',
        variant: 'destructive',
      });
      return;
    }

    // Validate that each meal plan has at least one selected member
    const invalidPlans = mealPlans.filter(plan => plan.selectedMembers.length === 0);
    if (invalidPlans.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Each meal plan must have at least one household member selected.',
        variant: 'destructive',
      });
      return;
    }

    const requestData = {
      groupName,
      mealPlans: mealPlans.map(plan => ({
        name: plan.name,
        targetGroup: plan.targetGroup,
        selectedMembers: plan.selectedMembers,
        goals: plan.goals,
        mealTypes: plan.mealTypes,
        duration: plan.duration,
        mealCount: plan.mealCount,
        budget: plan.budget,
        startDate: plan.startDate
      }))
    };

    generateMultiMealPlanMutation.mutate(requestData);
  };

  if (!householdMembers || (Array.isArray(householdMembers) && householdMembers.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Household Members</CardTitle>
          <CardDescription>Please add household members first in the Profile section.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Multiple Meal Plans</CardTitle>
        <CardDescription>
          Generate optimized meal plans for different groups (adults, kids, etc.) with shared ingredients to save money
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Family Meal Plans - Week 1"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Meal Plans</h3>
              <Button type="button" onClick={addMealPlan} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Meal Plan
              </Button>
            </div>

            {mealPlans.map((plan, index) => (
              <Card key={plan.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center space-x-2">
                      {(() => {
                        const targetOption = TARGET_GROUP_OPTIONS.find(opt => opt.value === plan.targetGroup);
                        const IconComponent = targetOption?.icon;
                        return IconComponent && <IconComponent className="h-4 w-4" />;
                      })()}
                      <span>Meal Plan {index + 1}</span>
                    </CardTitle>
                    {mealPlans.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeMealPlan(plan.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Plan Name</Label>
                      <Input
                        value={plan.name}
                        onChange={(e) => updateMealPlan(plan.id, { name: e.target.value })}
                        placeholder="e.g., Adult Meal Plan"
                        required
                      />
                    </div>
                    <div>
                      <Label>Target Group</Label>
                      <Select
                        value={plan.targetGroup}
                        onValueChange={(value) => updateMealPlan(plan.id, { targetGroup: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_GROUP_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Household Members</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.isArray(householdMembers) && householdMembers.map((member: any) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`member-${plan.id}-${member.id}`}
                            checked={plan.selectedMembers.includes(member.id)}
                            onCheckedChange={() => toggleMember(plan.id, member.id)}
                          />
                          <Label
                            htmlFor={`member-${plan.id}-${member.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {member.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Goals</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {GOAL_OPTIONS.map((goal) => (
                        <div
                          key={goal}
                          className={`p-2 border rounded-md cursor-pointer text-sm text-center transition-colors ${
                            plan.goals.includes(goal)
                              ? 'bg-blue-100 border-blue-500 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleGoal(plan.id, goal)}
                        >
                          {goal}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Meal Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {MEAL_TYPE_OPTIONS.map((mealType) => (
                        <div
                          key={mealType.value}
                          className={`px-3 py-1 border rounded-full cursor-pointer text-sm transition-colors ${
                            plan.mealTypes.includes(mealType.value)
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleMealType(plan.id, mealType.value)}
                        >
                          {mealType.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recipe Selection Option */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <ChefHat className="h-5 w-5 text-amber-600" />
                        <div>
                          <h4 className="font-medium text-amber-900">Include Your Existing Recipes</h4>
                          <p className="text-sm text-amber-700">Mix AI-generated meals with recipes from your library</p>
                        </div>
                      </div>
                      <Switch
                        checked={plan.includeExistingRecipes || false}
                        onCheckedChange={(checked) => updateMealPlan(plan.id, { includeExistingRecipes: checked })}
                      />
                    </div>
                    {plan.includeExistingRecipes && (
                      <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                        <p className="text-sm text-amber-800">
                          <strong>Note:</strong> This feature allows you to select specific recipes from your library 
                          and assign them to meal slots. AI will generate recipes for remaining empty slots.
                          Currently available for single meal plans - coming soon for multi-plans!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`duration-${plan.id}`}>Duration</Label>
                      <Select
                        value={plan.duration.toString()}
                        onValueChange={(value) => updateMealPlan(plan.id, { duration: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="5">5 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`mealCount-${plan.id}`}>Number of Meals</Label>
                      <Select
                        value={plan.mealCount.toString()}
                        onValueChange={(value) => updateMealPlan(plan.id, { mealCount: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 meals</SelectItem>
                          <SelectItem value="5">5 meals</SelectItem>
                          <SelectItem value="7">7 meals</SelectItem>
                          <SelectItem value="10">10 meals</SelectItem>
                          <SelectItem value="14">14 meals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`budget-${plan.id}`}>Budget (Optional)</Label>
                      <Input
                        id={`budget-${plan.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={plan.budget || ''}
                        onChange={(e) => updateMealPlan(plan.id, { 
                          budget: e.target.value ? parseFloat(e.target.value) : undefined 
                        })}
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Ingredient Optimization</h4>
            <p className="text-sm text-blue-700">
              Our AI will automatically optimize ingredients across all meal plans to minimize waste and reduce costs. 
              Shared ingredients like onions, garlic, and spices will be consolidated in your shopping list.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={generateMultiMealPlanMutation.isPending}
          >
            {generateMultiMealPlanMutation.isPending 
              ? "Generating Meal Plans..." 
              : `Generate ${mealPlans.length} Meal Plans`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}