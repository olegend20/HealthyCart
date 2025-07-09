import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, User, AlertCircle } from "lucide-react";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface HouseholdMemberSelectorProps {
  householdMembers: HouseholdMember[];
  selectedMembers: number[];
  onSelectionChange: (memberIds: number[]) => void;
  className?: string;
}

export default function HouseholdMemberSelector({
  householdMembers,
  selectedMembers,
  onSelectionChange,
  className = ""
}: HouseholdMemberSelectorProps) {
  const [showPresets, setShowPresets] = useState(false);

  // Simple toggle function without complex state logic
  const toggleMember = (memberId: number) => {
    const isSelected = selectedMembers.includes(memberId);
    if (isSelected) {
      onSelectionChange(selectedMembers.filter(id => id !== memberId));
    } else {
      onSelectionChange([...selectedMembers, memberId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(householdMembers.map(m => m.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const selectAdults = () => {
    const adultIds = householdMembers
      .filter(m => !m.age || m.age >= 18)
      .map(m => m.id);
    onSelectionChange(adultIds);
  };

  const selectChildren = () => {
    const childIds = householdMembers
      .filter(m => m.age && m.age < 18)
      .map(m => m.id);
    onSelectionChange(childIds);
  };

  // Simple computed values without useMemo
  const selectedNames = householdMembers
    .filter(m => selectedMembers.includes(m.id))
    .map(m => m.name)
    .join(", ");

  const selectedMemberData = householdMembers.filter(m => selectedMembers.includes(m.id));
  const allRestrictions = [...new Set(selectedMemberData.flatMap(m => m.dietaryRestrictions || []))];
  const allAllergies = [...new Set(selectedMemberData.flatMap(m => m.allergies || []))];

  if (householdMembers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Select Household Members</span>
          </CardTitle>
          <CardDescription>
            Choose which family members this meal plan is for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p>No household members found</p>
            <p className="text-sm">Add family members in your profile first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Select Household Members</span>
            </CardTitle>
            <CardDescription>
              Choose which family members this meal plan is for
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
          >
            Quick Select
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Selection Presets */}
        {showPresets && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                All Members
              </Button>
              <Button size="sm" variant="outline" onClick={selectAdults}>
                Adults Only
              </Button>
              <Button size="sm" variant="outline" onClick={selectChildren}>
                Children Only
              </Button>
              <Button size="sm" variant="outline" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Member Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {householdMembers.map((member) => {
            const isSelected = selectedMembers.includes(member.id);
            return (
              <div
                key={member.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleMember(member.id)}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isSelected}
                    readOnly
                    className="pointer-events-none"
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    {member.age && (
                      <p className="text-sm text-gray-500">Age: {member.age}</p>
                    )}
                  </div>
                </div>
                
                {/* Dietary Info */}
                {(member.dietaryRestrictions.length > 0 || member.allergies.length > 0) && (
                  <div className="mt-2 space-y-1">
                    {member.dietaryRestrictions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.dietaryRestrictions.map((restriction) => (
                          <Badge key={restriction} variant="secondary" className="text-xs">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {member.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.allergies.map((allergy) => (
                          <Badge key={allergy} variant="destructive" className="text-xs">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selection Summary */}
        {selectedMembers.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Selected Members ({selectedMembers.length})</span>
            </div>
            <p className="text-sm text-blue-700 mb-2">{selectedNames}</p>
            
            {/* Dietary Summary */}
            {(allRestrictions.length > 0 || allAllergies.length > 0) && (
              <div className="mt-2 space-y-1">
                {allRestrictions.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-blue-800">Dietary Restrictions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {allRestrictions.map(restriction => (
                        <Badge key={restriction} variant="secondary" className="text-xs">
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {allAllergies.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-blue-800">Allergies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {allAllergies.map(allergy => (
                        <Badge key={allergy} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}