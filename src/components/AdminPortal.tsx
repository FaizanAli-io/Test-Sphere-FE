"use client";

import React, { useState } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPortal(): ReactElement {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const quickActions = [
    {
      title: "Create New Class",
      description: "Set up a new class for your students",
      icon: "🏫",
      action: () => router.push("/create-class"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Create Test",
      description: "Design and schedule a new test",
      icon: "📝",
      action: () => router.push("/create-test"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "View Analytics",
      description: "Check student performance and insights",
      icon: "📊",
      action: () => router.push("/analytics"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Manage Students",
      description: "View and manage student accounts",
      icon: "👥",
      action: () => router.push("/manage-students"),
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to TestSphere Admin Portal
          </h1>
          <p className="text-xl text-gray-600">
            Manage your classes, tests, and students efficiently
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-4">{action.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600 mb-4">{action.description}</p>
              <button
                onClick={action.action}
                className={`w-full ${action.color} text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: "overview", label: "Overview" },
              { id: "classes", label: "My Classes" },
              { id: "tests", label: "Tests" },
              { id: "students", label: "Students" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "overview" && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎓</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Ready to get started?
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose an action above or navigate to your dashboard for detailed management.
                </p>
                <Link
                  href="/teacherdashboard"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}

            {activeTab === "classes" && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏫</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Manage Your Classes
                </h3>
                <p className="text-gray-600 mb-6">
                  Create new classes or manage existing ones.
                </p>
                <button
                  onClick={() => router.push("/create-class")}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Class
                </button>
              </div>
            )}

            {activeTab === "tests" && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Test Management
                </h3>
                <p className="text-gray-600 mb-6">
                  Create, schedule, and review tests.
                </p>
                <button
                  onClick={() => router.push("/create-test")}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create New Test
                </button>
              </div>
            )}

            {activeTab === "students" && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Student Management
                </h3>
                <p className="text-gray-600 mb-6">
                  View and manage student accounts and performance.
                </p>
                <button
                  onClick={() => router.push("/manage-students")}
                  className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Manage Students
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


