import React from "react";
import { Class, NewClass } from "../types";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cls: Class | NewClass) => Promise<boolean>;
  class?: Class | null;
  loading?: boolean;
  title: string;
  submitText: string;
  icon: string;
  colorScheme: "indigo" | "yellow";
}

export default function ClassModal({
  isOpen,
  onClose,
  onSubmit,
  class: classData,
  loading = false,
  title,
  submitText,
  icon,
  colorScheme,
}: ClassModalProps) {
  const [formData, setFormData] = React.useState<NewClass>({
    name: classData?.name || "",
    description: classData?.description || "",
  });

  React.useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        description: classData.description,
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [classData]);

  const handleSubmit = async () => {
    const success = await onSubmit(
      classData ? { ...classData, ...formData } : formData
    );
    if (success) {
      onClose();
      setFormData({ name: "", description: "" });
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ name: "", description: "" });
  };

  if (!isOpen) return null;

  const colors = {
    indigo: {
      gradient: "from-indigo-600 to-blue-600",
      hoverGradient: "hover:from-indigo-700 hover:to-blue-700",
      focus: "focus:ring-indigo-500 focus:border-indigo-500",
    },
    yellow: {
      gradient: "from-yellow-500 to-orange-500",
      hoverGradient: "hover:from-yellow-600 hover:to-orange-600",
      focus: "focus:ring-yellow-500 focus:border-yellow-500",
    },
  };

  const colorConfig = colors[colorScheme];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform animate-slideUp">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${colorConfig.gradient} rounded-xl flex items-center justify-center text-2xl`}
          >
            {icon}
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 ${colorConfig.focus} text-gray-900 bg-gray-50 focus:bg-white transition-all font-medium`}
              placeholder="e.g., Mathematics 101"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={`w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 ${colorConfig.focus} text-gray-900 bg-gray-50 focus:bg-white transition-all font-medium resize-none`}
              rows={4}
              placeholder="Brief description of the class (optional)"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 px-6 py-4 bg-gradient-to-r ${colorConfig.gradient} text-white font-bold rounded-xl ${colorConfig.hoverGradient} transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg`}
          >
            {loading ? "Processing..." : submitText}
          </button>
        </div>
      </div>
    </div>
  );
}
