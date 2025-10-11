import React from "react";
import BaseClassCard from "./BaseClassCard";
import BaseQuickActionCard from "./BaseQuickActionCard";
import { BasePortalProps } from "./types";

export default function BasePortal({
  title,
  subtitle,
  headerIcon,
  quickActions,
  classes,
  loading,
  error,
  success,
  copiedCode,
  classListTitle,
  classListSubtitle,
  primaryActionLabel,
  onPrimaryAction,
  emptyStateTitle,
  emptyStateSubtitle,
  emptyStateIcon,
  emptyStateActionLabel,
  onCopyCode,
  classCardActions,
  children
}: BasePortalProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            {headerIcon}
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
            {title}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-slideIn">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <BaseQuickActionCard
              key={index}
              onClick={action.onClick}
              icon={action.icon}
              title={action.title}
              description={action.description}
              actionText={action.actionText}
              colorScheme={action.colorScheme}
            />
          ))}
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {classListTitle}
              </h3>
              <p className="text-gray-600">{classListSubtitle}</p>
            </div>
            <button
              onClick={onPrimaryAction}
              className="group px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>{primaryActionLabel}</span>
            </button>
          </div>

          {loading && !classes.length ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
              </div>
              <p className="text-gray-600 font-semibold mt-6 text-lg">
                Loading your classes...
              </p>
            </div>
          ) : error && !classes.length ? (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-700 font-bold text-lg mb-2">
                Error Loading Classes
              </p>
              <p className="text-red-600">{error}</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                {emptyStateIcon}
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">
                {emptyStateTitle}
              </h4>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                {emptyStateSubtitle}
              </p>
              <button
                onClick={onPrimaryAction}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-lg"
              >
                {emptyStateActionLabel}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {classes.map((cls) => (
                <BaseClassCard
                  key={cls.id}
                  classData={cls}
                  copiedCode={copiedCode}
                  onCopyCode={onCopyCode}
                  actions={classCardActions}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional content like modals */}
      {children}
    </div>
  );
}
