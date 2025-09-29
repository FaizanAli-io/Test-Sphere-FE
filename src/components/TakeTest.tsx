"use client";

import React from "react";
import { useParams } from "next/navigation";

export default function TakeTest() {
  const params = useParams<{ classId: string; testId: string }>();

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Take Test</h2>
      <div className="text-lg text-gray-700 text-center">
        Class: <span className="font-semibold">{params?.classId}</span>
        <br />
        Test: <span className="font-semibold">{params?.testId}</span>
      </div>
    </div>
  );
}
