import React, { useState } from "react";

interface GoogleSignupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: { role: "STUDENT" | "TEACHER"; cnic: string }) => void;
}

export default function GoogleSignupModal({ open, onClose, onSubmit }: GoogleSignupModalProps) {
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [cnic, setCnic] = useState("");
  const [errors, setErrors] = useState<{ cnic?: string }>({});

  const validateCnic = (value: string): string | null => {
    // Remove any non-digits
    const digits = value.replace(/\D/g, "");

    if (digits.length === 0) {
      return "CNIC is required";
    }

    if (digits.length !== 13) {
      return "CNIC must be exactly 13 digits";
    }

    return null;
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and limit to 13
    const digits = value.replace(/\D/g, "").slice(0, 13);
    setCnic(digits);

    // Clear error when user starts typing
    if (errors.cnic) {
      setErrors({ ...errors, cnic: undefined });
    }
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    const cnicError = validateCnic(cnic);
    if (cnicError) {
      setErrors({ cnic: cnicError });
      return;
    }

    setErrors({});
    onSubmit({ role, cnic });
  };

  const handleClose = () => {
    setRole("STUDENT");
    setCnic("");
    setErrors({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Complete Your Signup</h2>
            <p className="text-sm text-gray-500">Just a few more details to get started</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-all duration-200"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
              Select Your Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "STUDENT" | "TEACHER")}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-gray-400 shadow-sm"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>

          <div>
            <label htmlFor="cnic" className="block text-sm font-semibold text-gray-700 mb-2">
              CNIC Number
              <span className="text-gray-400 font-normal ml-1">(13 digits)</span>
            </label>
            <input
              id="cnic"
              type="text"
              value={cnic}
              onChange={handleCnicChange}
              placeholder="3520212345678"
              className={`w-full px-4 py-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm ${
                errors.cnic
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/50"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
              }`}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            {errors.cnic && (
              <div className="flex items-center gap-1.5 mt-2">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-600 font-medium">{errors.cnic}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              Complete Signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
