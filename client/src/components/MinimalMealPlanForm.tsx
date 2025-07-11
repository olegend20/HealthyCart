import React, { useState } from "react";
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

interface MinimalMealPlanFormProps {
  householdMembers: HouseholdMember[];
  onSuccess?: () => void;
}

export default function MinimalMealPlanForm({ householdMembers, onSuccess }: MinimalMealPlanFormProps) {
  const [name, setName] = useState('');
  
  console.log("MinimalMealPlanForm render, name:", name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with name:", name);
    alert(`Form submitted with name: ${name}`);
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>Minimal Test Form</span>
        </CardTitle>
        <CardDescription>
          Testing for infinite loop issue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Meal Plan Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                console.log("Input onChange called with:", e.target.value);
                setName(e.target.value);
              }}
              placeholder="Type 'Dave' here"
              required
            />
          </div>

          <div>
            <p>Current name: {name}</p>
            <p>Household members: {householdMembers.length}</p>
          </div>

          <Button type="submit" className="w-full">
            Test Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}