"use client";

import React from "react";

interface Policy {
  id: number;
  name: string;
}

export default function ExamplePage(): React.JSX.Element {
  const [policies, setPolicies] = React.useState<Policy[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleButtonClick = (): void => {
    setPolicies((prev: Policy[]) => [...prev, { id: Date.now(), name: "New Policy" }]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Policy Management</h1>
      
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Search policies..."
        className="border p-2 rounded mb-4"
      />
      
      <button
        onClick={handleButtonClick}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Add Policy
      </button>

      <div className="mt-4">
        {policies.map((policy: Policy) => (
          <div key={policy.id} className="border p-2 mb-2 rounded">
            <span>{policy.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}