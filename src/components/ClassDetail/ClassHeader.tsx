"use client";
import React from "react";

interface ClassHeaderProps {
  classData: {
    id: number;
    name: string;
    description: string;
    code: string;
    students: any[];
  };
  testsCount: number;
  onBack: () => void;
}

const ClassHeader: React.FC<ClassHeaderProps> = ({ classData, testsCount, onBack }) => {
  return (
    <>
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold mb-8 transition-all"
      >
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
        Back to Teacher Portal
      </button>
      <div className="bg-gradient-to-br from-white to-indigo-50 rounded-3xl shadow-xl border-2 border-indigo-100 p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-full -mr-20 -mt-20" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{classData.name}</h1>
          <p className="text-gray-600 text-lg mb-4">
            {classData.description || "No description provided"}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-md">
              Code: {classData.code}
            </div>
            <div className="px-4 py-2 bg-green-100 text-green-800 font-bold rounded-xl border-2 border-green-300">
              {classData.students?.length || 0} Students
            </div>
            <div className="px-4 py-2 bg-orange-100 text-orange-800 font-bold rounded-xl border-2 border-orange-300">
              {testsCount} Tests
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClassHeader;
