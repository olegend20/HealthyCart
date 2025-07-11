import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Completely isolated component with no external dependencies
export default function IsolatedTest() {
  const [name, setName] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Isolated Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-name">Name</Label>
            <Input
              id="test-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type Dave here"
            />
          </div>
          <p>Current value: {name}</p>
          <Button onClick={() => alert(`Name is: ${name}`)}>
            Test Button
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}