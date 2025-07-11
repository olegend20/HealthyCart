import React, { useState } from "react";

interface TestFormProps {
  onClose: () => void;
}

export default function TestForm({ onClose }: TestFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with name:", name);
    alert(`Meal plan name: ${name}`);
    onClose();
  };

  return (
    <div className="p-4 bg-white border rounded">
      <h2 className="text-lg font-bold mb-4">Test Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Type 'Dave' here"
          />
        </div>
        <div className="space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}