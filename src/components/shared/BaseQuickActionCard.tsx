import React from "react";

interface QuickActionCardProps {
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
  actionText: string;
  colorScheme: "indigo" | "orange" | "green" | "blue";
}

const colorSchemes = {
  indigo: {
    gradient: "from-indigo-600 to-purple-600",
    hoverBorder: "hover:border-indigo-300",
    hoverText: "group-hover:text-indigo-600",
    actionText: "text-indigo-600"
  },
  orange: {
    gradient: "from-orange-500 to-red-500",
    hoverBorder: "hover:border-orange-300",
    hoverText: "group-hover:text-orange-600",
    actionText: "text-orange-600"
  },
  green: {
    gradient: "from-green-500 to-emerald-600",
    hoverBorder: "hover:border-green-300",
    hoverText: "group-hover:text-green-600",
    actionText: "text-green-600"
  },
  blue: {
    gradient: "from-blue-500 to-indigo-600",
    hoverBorder: "hover:border-blue-300",
    hoverText: "group-hover:text-blue-600",
    actionText: "text-blue-600"
  }
};

export default function BaseQuickActionCard({
  onClick,
  icon,
  title,
  description,
  actionText,
  colorScheme
}: QuickActionCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <button
      onClick={onClick}
      className={`group bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-2xl ${colors.hoverBorder} transition-all duration-300 hover:-translate-y-1 text-left`}
    >
      <div
        className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:shadow-xl transition-shadow group-hover:scale-110 duration-300`}
      >
        <span className="text-2xl">{icon}</span>
      </div>
      <h3
        className={`text-2xl font-bold text-gray-900 mb-2 ${colors.hoverText} transition-colors`}
      >
        {title}
      </h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div
        className={`${colors.actionText} font-semibold flex items-center gap-2`}
      >
        {actionText}
        <span className="group-hover:translate-x-2 transition-transform duration-300">
          →
        </span>
      </div>
    </button>
  );
}
