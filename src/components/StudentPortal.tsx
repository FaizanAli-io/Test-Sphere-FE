"use client";

import React, { useEffect, useState } from "react";
import type { ReactElement } from "react";

// Subcomponents (make sure you also convert them later)
import EnrollClass from "./EnrollClass";
import EnrolledClasses from "./EnrolledClasses";

interface ClassData {
  class_id: string;
  class_name: string;
}

export default function StudentPortal(): ReactElement {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [error, setError] = useState<string>("");

  // ✅ Fetch enrolled classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/classes`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch classes.");
        }

        const data = await response.json();
        const formattedData: ClassData[] = data.map((item: any) => ({
          class_id: item.class_id,
          class_name: item.class_name,
        }));
        setClasses(formattedData);
      } catch (err: any) {
        console.error("Error fetching classes:", err);
        setError(err.message);
      }
    };

    fetchClasses();
  }, []);

  // ✅ Handle enroll callback
  const handleEnroll = (newClass: ClassData) => {
    setClasses((prev) => [...prev, newClass]);
  };

  // ✅ Leave class
  const leaveClass = async (classId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leave-class`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ classId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to leave class.");
      }

      setClasses((prev) => prev.filter((c) => c.class_id !== classId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ✅ Inline Tailwind styling (no CSS file needed)
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          Student Portal
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700">
            {error}
          </div>
        )}

        {/* Enroll new class */}
        <EnrollClass onEnroll={handleEnroll} />

        {/* List enrolled classes */}
        <EnrolledClasses classes={classes} onLeave={leaveClass} />
      </div>
    </div>
  );
}
