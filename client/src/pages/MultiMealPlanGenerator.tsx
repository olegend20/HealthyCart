import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Utensils, ShoppingCart, TrendingUp } from 'lucide-react';
import { MultiMealPlanForm } from '@/components/MultiMealPlanForm';
import { useAuth } from '@/hooks/useAuth';

export default function MultiMealPlanGenerator() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { data: householdMembers } = useQuery({
    queryKey: ['/api/household-members'],
    enabled: !!user,
  });

  const { data: cookingEquipment } = useQuery({
    queryKey: ['/api/cooking-equipment'],
    enabled: !!user,
  });

  const handleSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Success!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Your multi-meal plans have been generated with optimized ingredients for maximum savings.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to home page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Multi-Meal Plan Generator
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create multiple coordinated meal plans (adults, kids, special diets) with AI-optimized ingredient overlap to reduce waste and save money.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <MultiMealPlanForm onSuccess={handleSuccess} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <ShoppingCart className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Save Money</p>
                    <p className="text-xs text-gray-600">Shared ingredients reduce total grocery costs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Utensils className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Reduce Waste</p>
                    <p className="text-xs text-gray-600">Use ingredients efficiently across multiple plans</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Personalized</p>
                    <p className="text-xs text-gray-600">Separate plans for different dietary needs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Household Summary */}
            {householdMembers && householdMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Household Members</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {householdMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-gray-500">
                          {member.age ? `${member.age} years` : 'Age unspecified'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Equipment Summary */}
            {cookingEquipment && cookingEquipment.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Utensils className="h-5 w-5" />
                    <span>Cooking Equipment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cookingEquipment.map((equipment: any) => (
                      <div key={equipment.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{equipment.name}</span>
                        <span className="text-gray-500 capitalize">{equipment.type}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Create Multiple Plans</p>
                    <p className="text-xs text-gray-600">Set up separate meal plans for different groups</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Optimization</p>
                    <p className="text-xs text-gray-600">Our AI finds shared ingredients to reduce costs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Consolidated Shopping</p>
                    <p className="text-xs text-gray-600">Get one optimized shopping list for all plans</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}