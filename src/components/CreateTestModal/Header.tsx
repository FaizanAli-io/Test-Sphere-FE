"use client";

import React from "react";

interface HeaderProps {
  onClose: () => void;
}

export const CreateTestModalHeader: React.FC<HeaderProps> = ({ onClose }) => {
  return (
    <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">📝</span>
          Create New Test
        </h2>
        <p className="mt-1 text-purple-100">Configure the basic details of your test</p>
      </div>
      <button
        onClick={onClose}
        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors text-white font-bold text-xl"
      >
        ✕
      </button>
    </div>
  );
};

export default CreateTestModalHeader;
