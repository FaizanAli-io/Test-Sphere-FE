"use client";

import React, { useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ClassData {
  class_id: string;
  class_name: string;
}

interface EnrolledClassesProps {
  classes: ClassData[];
  onLeave: (classId: string) => void;
}

export default function EnrolledClasses({ classes, onLeave }: EnrolledClassesProps): ReactElement {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const handleLeaveClick = (classId: string) => {
    setSelectedClassId(classId);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (selectedClassId) {
      onLeave(selectedClassId);
    }
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <motion.div
      className="mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Enrolled Classes</h2>
      
      {classes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No classes enrolled yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem, index) => (
            <motion.div
              key={classItem.class_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
            >
              <Link href={`/class/${classItem.class_id}/student`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition">
                  {classItem.class_name || "Unnamed Class"}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 mb-4">Class ID: {classItem.class_id}</p>
              <motion.button
                onClick={() => handleLeaveClick(classItem.class_id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Leave Class
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <p className="text-gray-800 mb-4">Are you sure you want to leave this class?</p>
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleConfirm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Yes
                </motion.button>
                <motion.button
                  onClick={handleCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  No
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}