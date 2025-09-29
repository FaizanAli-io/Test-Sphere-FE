"use client";

import { useState } from "react";

interface EnrollClassProps {
  onEnroll: (newClass: ClassItem) => void;
}

interface ClassItem {
  class_id: string;
  class_name: string;
  class_code: string;
}

const EnrollClass: React.FC<EnrollClassProps> = ({ onEnroll }) => {
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const enrollInClass = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ classCode }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enroll in class.");
      }

      setSuccess("Successfully enrolled in the class.");
      setError("");
      setClassCode("");
      onEnroll(data.class);
      setShowForm(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setSuccess("");
    }
  };

  if (!showForm) {
    return (
      <button className="floating-add-button" onClick={() => setShowForm(true)}>
        <span>+</span>
      </button>
    );
  }

  return (
    <div className="enroll-form-overlay">
      <div className="enroll-section">
        <h2>Enroll in a Class</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <input
          type="text"
          placeholder="Enter Class Code"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
        />
        <button onClick={enrollInClass}>Enroll</button>
        <button onClick={() => setShowForm(false)} className="close-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default EnrollClass;
