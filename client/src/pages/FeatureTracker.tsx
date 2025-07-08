import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Settings, 
  ArrowLeft,
  FileText,
  Users,
  ChefHat,
  ShoppingCart,
  Calendar,
  Star
} from "lucide-react";
import { Link } from "wouter";

interface Feature {
  id: string;
  title: string;
  status: "disabled" | "in_progress" | "enabled";
  description: string;
  dependencies: string[];
  priority: 1 | 2 | 3 | 4;
  phase: 1 | 2 | 3;
  icon: React.ElementType;
}

const features: Feature[] = [
  {
    id: "household_member_selection",
    title: "Household Member Selection",
    status: "enabled",
    description: "Select specific household members for each meal plan",
    dependencies: [],
    priority: 1,
    phase: 1,
    icon: Users
  },
  {
    id: "individual_recipes",
    title: "Individual Recipe Generation",
    status: "disabled",
    description: "Generate individual recipes for each meal slot considering selected members",
    dependencies: ["household_member_selection"],
    priority: 1,
    phase: 1,
    icon: ChefHat
  },
  {
    id: "meal_approval",
    title: "Meal Approval Workflow",
    status: "disabled",
    description: "Allow users to approve/reject individual meals before finalizing",
    dependencies: ["individual_recipes"],
    priority: 1,
    phase: 1,
    icon: CheckCircle
  },
  {
    id: "recipe_regeneration",
    title: "Recipe Regeneration",
    status: "disabled",
    description: "Regenerate rejected meals with new recipes",
    dependencies: ["meal_approval"],
    priority: 2,
    phase: 2,
    icon: Settings
  },
  {
    id: "meal_plan_status",
    title: "Meal Plan Status System",
    status: "disabled",
    description: "Track meal plans through planning → active → completed phases",
    dependencies: [],
    priority: 1,
    phase: 1,
    icon: Calendar
  },
  {
    id: "recipe_detail_view",
    title: "Recipe Detail View",
    status: "disabled",
    description: "Full recipe view with ingredients, instructions, and nutrition",
    dependencies: ["individual_recipes"],
    priority: 1,
    phase: 1,
    icon: FileText
  },
  {
    id: "optimized_grocery_lists",
    title: "Optimized Grocery List Generation",
    status: "disabled",
    description: "Create grocery lists only after meal approval with ingredient optimization",
    dependencies: ["meal_approval"],
    priority: 2,
    phase: 2,
    icon: ShoppingCart
  },
  {
    id: "meal_planning_dashboard",
    title: "Meal Planning Dashboard",
    status: "disabled",
    description: "Specialized dashboard for meal planning vs active meal plans",
    dependencies: ["meal_plan_status"],
    priority: 2,
    phase: 2,
    icon: Users
  },
  {
    id: "recipe_variation_preferences",
    title: "Recipe Variation Preferences",
    status: "disabled",
    description: "Learn from user rejections to improve future generations",
    dependencies: ["recipe_regeneration"],
    priority: 3,
    phase: 3,
    icon: Star
  }
];

export default function FeatureTracker() {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enabled": return "bg-green-500";
      case "in_progress": return "bg-yellow-500";
      case "disabled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "enabled": return "Enabled";
      case "in_progress": return "In Progress";
      case "disabled": return "Disabled";
      default: return "Unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enabled": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "disabled": return <XCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredFeatures = selectedPhase 
    ? features.filter(f => f.phase === selectedPhase)
    : features;

  const phaseProgress = (phase: number) => {
    const phaseFeatures = features.filter(f => f.phase === phase);
    const enabledCount = phaseFeatures.filter(f => f.status === "enabled").length;
    return (enabledCount / phaseFeatures.length) * 100;
  };

  const overallProgress = () => {
    const enabledCount = features.filter(f => f.status === "enabled").length;
    return (enabledCount / features.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-bold text-gray-900">Feature Tracker</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-gray-500">{Math.round(overallProgress())}%</span>
                  </div>
                  <Progress value={overallProgress()} className="h-2" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(phase => (
                    <div key={phase}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Phase {phase}</span>
                        <span className="text-sm text-gray-500">{Math.round(phaseProgress(phase))}%</span>
                      </div>
                      <Progress value={phaseProgress(phase)} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase Filter */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Button
              variant={selectedPhase === null ? "default" : "outline"}
              onClick={() => setSelectedPhase(null)}
            >
              All Features
            </Button>
            {[1, 2, 3].map(phase => (
              <Button
                key={phase}
                variant={selectedPhase === phase ? "default" : "outline"}
                onClick={() => setSelectedPhase(phase)}
              >
                Phase {phase}
              </Button>
            ))}
          </div>
        </div>

        {/* Feature List */}
        <div className="grid gap-6">
          {filteredFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">Phase {feature.phase}</Badge>
                          <Badge variant="outline">Priority {feature.priority}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-white text-sm ${getStatusColor(feature.status)}`}>
                        {getStatusIcon(feature.status)}
                        <span>{getStatusText(feature.status)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  
                  {feature.dependencies.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Dependencies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {feature.dependencies.map(dep => {
                          const depFeature = features.find(f => f.id === dep);
                          return (
                            <Badge key={dep} variant="secondary">
                              {depFeature?.title || dep}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {feature.status === "enabled" ? "✅ Ready to use" : 
                       feature.status === "in_progress" ? "🔄 In development" : 
                       "⏳ Waiting for implementation"}
                    </div>
                    <Button variant="outline" size="sm" disabled={feature.status === "disabled"}>
                      {feature.status === "disabled" ? "Not Available" : "View Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Implementation Notes */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Current Issues:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Meal plan generation creates grocery lists immediately (should wait for approval)</li>
                    <li>No individual recipe generation per meal slot</li>
                    <li>No user approval/rejection workflow</li>
                    <li>No recipe detail viewing capability</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Next Steps:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Implement individual recipe generation as first priority</li>
                    <li>Add meal plan status system (planning → active → completed)</li>
                    <li>Create meal approval interface</li>
                    <li>Delay grocery list creation until after approval</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}