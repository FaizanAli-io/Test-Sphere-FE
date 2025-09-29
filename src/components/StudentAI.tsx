"use client";

import React, { useState } from "react";

export default function StudentAI() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate AI response
    setResponse(`AI Response to: "${input}"`);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Student AI</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask something..."
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition"
        >
          Ask AI
        </button>
      </form>
      {response && (
        <div className="mt-6 p-4 bg-gray-100 rounded text-gray-800">
          {response}
        </div>
      )}
    </div>
  );
}
