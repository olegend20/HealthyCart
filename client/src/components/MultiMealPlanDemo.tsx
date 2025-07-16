import React from "react";

interface MultiMealPlanDemoProps {
  onClose: () => void;
}

export default function MultiMealPlanDemo({ onClose }: MultiMealPlanDemoProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Multi-Target Meal Planning Demo
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                How Multi-Target Meal Planning Works
              </h3>
              <p className="text-blue-800 text-sm">
                Create multiple meal plans for different groups (adults, kids, dietary needs) 
                with intelligent ingredient optimization to reduce costs and waste.
              </p>
            </div>

            {/* Step 1: Setup */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Step 1: Group Setup</h4>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm">
                  <strong>Group Name:</strong> "Family Weekly Multi-Target Planning"
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Optional name for organizing multiple meal plans together
                </div>
              </div>
            </div>

            {/* Step 2: Configure Plans */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Step 2: Configure Multiple Plans</h4>
              
              <div className="space-y-4">
                {/* Plan 1 */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">
                    Plan 1: Adult Healthy Dinners
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Target:</strong> Adults Only</div>
                    <div><strong>Duration:</strong> 7 days</div>
                    <div><strong>Meals:</strong> Dinner</div>
                    <div><strong>Budget:</strong> $80</div>
                    <div className="col-span-2">
                      <strong>Goals:</strong> Reduced calories, Higher protein, Heart-healthy
                    </div>
                  </div>
                </div>

                {/* Plan 2 */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-medium text-orange-900 mb-2">
                    Plan 2: Kid-Friendly Meals
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Target:</strong> Kids Only</div>
                    <div><strong>Duration:</strong> 7 days</div>
                    <div><strong>Meals:</strong> Lunch, Dinner</div>
                    <div><strong>Budget:</strong> $60</div>
                    <div className="col-span-2">
                      <strong>Goals:</strong> Kid-friendly, Increased vegetables, Quick meals
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Results */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Step 3: Intelligent Optimization</h4>
              
              <div className="space-y-4">
                {/* Optimization Benefits */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-900 mb-2">
                    Optimization Results
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Shared Ingredients:</strong> 15 items</div>
                    <div><strong>Cost Savings:</strong> $37.50</div>
                    <div><strong>Waste Reduction:</strong> 68%</div>
                    <div><strong>Overlap Efficiency:</strong> 85%</div>
                  </div>
                </div>

                {/* Consolidated Shopping List */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Consolidated Shopping List
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Chicken breast (3 lbs)</span>
                      <span className="text-green-600">Used in both plans</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brown rice (2 bags)</span>
                      <span className="text-green-600">Used in both plans</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Broccoli (3 heads)</span>
                      <span className="text-green-600">Used in both plans</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Olive oil (1 bottle)</span>
                      <span className="text-green-600">Used in both plans</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      + 25 more items organized by store aisle
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Key Features</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Create separate meal plans for different household groups</li>
                <li>• Intelligent ingredient sharing reduces waste and costs</li>
                <li>• Consolidated shopping lists organized by store layout</li>
                <li>• Real-time optimization metrics and cost tracking</li>
                <li>• Supports dietary restrictions and nutrition goals</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Try Multi-Target Planning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}