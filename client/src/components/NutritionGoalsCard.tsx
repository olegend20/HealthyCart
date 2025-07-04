import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Leaf } from "lucide-react";

interface NutritionGoal {
  id: number;
  name: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
}

interface NutritionGoalsCardProps {
  goals?: NutritionGoal[];
}

export default function NutritionGoalsCard({ goals = [] }: NutritionGoalsCardProps) {
  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-secondary";
    if (progress >= 60) return "bg-accent";
    return "bg-primary";
  };

  const mockGoals = [
    {
      id: 1,
      name: "Vegetables for Kids",
      currentValue: 6,
      targetValue: 7,
      unit: "days",
      progress: 85
    },
    {
      id: 2,
      name: "Protein Variety",
      currentValue: 4,
      targetValue: 5,
      unit: "types",
      progress: 80
    },
    {
      id: 3,
      name: "Whole Grains",
      currentValue: 5,
      targetValue: 7,
      unit: "days",
      progress: 71
    }
  ];

  const displayGoals = goals.length > 0 ? goals : mockGoals;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-900">Nutrition Goals</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {displayGoals.length > 0 ? (
          <div className="space-y-4">
            {displayGoals.map((goal: any) => {
              const progress = goal.progress || calculateProgress(
                parseFloat(goal.currentValue?.toString() || "0"),
                parseFloat(goal.targetValue?.toString() || "1")
              );
              
              return (
                <div key={goal.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{goal.name}</span>
                    <span className="text-sm text-gray-500">
                      {goal.currentValue || 0}/{goal.targetValue || 0} {goal.unit || ""}
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="w-full h-2"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p>No nutrition goals set</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
