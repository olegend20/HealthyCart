import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Users } from "lucide-react";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface SimpleHouseholdSelectorProps {
  householdMembers: HouseholdMember[];
  selectedMembers: number[];
  onSelectionChange: (memberIds: number[]) => void;
}

export default function SimpleHouseholdSelector({
  householdMembers,
  selectedMembers,
  onSelectionChange
}: SimpleHouseholdSelectorProps) {
  if (!householdMembers || householdMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Household Members</CardTitle>
          <CardDescription>No household members found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleClick = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      onSelectionChange(selectedMembers.filter(id => id !== memberId));
    } else {
      onSelectionChange([...selectedMembers, memberId]);
    }
  };

  return (
    <Card>
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
        <div className="space-y-2">
          {householdMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => handleClick(member.id)}
            >
              <Checkbox
                checked={selectedMembers.includes(member.id)}
                readOnly
                className="pointer-events-none"
              />
              <span className="font-medium">{member.name}</span>
              {member.age && <span className="text-sm text-gray-500">({member.age} years)</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}