"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TeacherDashboardData {
  teacher?: {
    name: string;
    email: string;
    id: string;
  };
  statistics?: {
    total_classes: number;
    total_students: number;
    upcoming_tests: number;
    completed_tests: number;
  };
  classes?: {
    class_id: string;
    class_name: string;
    class_code: string;
    student_count: number;
  }[];
  upcomingTests?: {
    test_id: string;
    title: string;
    class_name: string;
    date: string;
  }[];
  completedTests?: {
    test_id: string;
    title: string;
    class_name: string;
    attempted_students: number;
    total_students: number;
    average_score: number;
    date: string;
  }[];
}

export default function TeacherDashboard() {
  const [dashboardData, setDashboardData] =
    useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Utility functions
  const getSubmissionRate = (test: {
    attempted_students: number;
    total_students: number;
  }) => {
    if (!test.total_students || test.total_students === 0) return "0%";
    const percentage = Math.round(
      (test.attempted_students / test.total_students) * 100
    );
    return `${percentage}%`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-PK", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-PK", {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSubmissionRateColor = (attempted: number, total: number) => {
    if (!total) return "text-gray-600";
    const rate = (attempted / total) * 100;
    if (rate >= 80) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth");
          return;
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://test-sphere-be.onrender.com/api";

        const response = await fetch(`${apiUrl}/teacher-dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/auth");
          }
          const errorText = await response.text();
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load data");
        } else {
          setError("Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  // Loading state
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-indigo-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-10 w-10 bg-indigo-600 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">
          Loading your dashboard...
        </p>
      </div>
    );

  // Error state
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-red-600 mb-6 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );

  if (!dashboardData)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg">No dashboard data available</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 mb-3">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Welcome back, {dashboardData.teacher?.name}!
          </p>
        </div>

        {/* Teacher Info Card */}
        <div className="mb-10">
          <div className="bg-gradient-to-br from-white to-indigo-50 shadow-xl rounded-2xl p-8 border border-indigo-100">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full p-4 mr-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Profile Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Full Name
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {dashboardData.teacher?.name}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Email Address
                </p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {dashboardData.teacher?.email}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Teacher ID
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {dashboardData.teacher?.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Overview Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white bg-opacity-30 rounded-full p-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold">
                    {dashboardData.statistics?.total_classes || 0}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-semibold">Total Classes</h3>
              <p className="text-blue-100 text-sm mt-1">
                Active classes you manage
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white bg-opacity-30 rounded-full p-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold">
                    {dashboardData.statistics?.total_students || 0}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-semibold">Total Students</h3>
              <p className="text-green-100 text-sm mt-1">
                Students across all classes
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white bg-opacity-30 rounded-full p-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold">
                    {dashboardData.statistics?.upcoming_tests || 0}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-semibold">Upcoming Tests</h3>
              <p className="text-purple-100 text-sm mt-1">
                Scheduled assessments
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white bg-opacity-30 rounded-full p-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold">
                    {dashboardData.statistics?.completed_tests || 0}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-semibold">Completed Tests</h3>
              <p className="text-orange-100 text-sm mt-1">
                Finished assessments
              </p>
            </div>
          </div>
        </div>

        {/* Classes */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🏫</span>
            Your Classes
          </h2>
          {dashboardData.classes?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.classes.map((cls) => (
                <div
                  key={cls.class_id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{cls.class_name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-semibold">
                        {cls.class_code}
                      </span>
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="font-bold">{cls.student_count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <button
                      onClick={() => router.push(`/class/${cls.class_id}`)}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md"
                    >
                      Manage Class →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">🏫</div>
              <p className="text-gray-500 text-lg">
                You haven&apos;t created any classes yet.
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Tests */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📅</span>
            Upcoming Tests
          </h2>
          {dashboardData.upcomingTests?.length ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                        Test Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                        Time (PKT)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboardData.upcomingTests.map((test, index) => (
                      <tr
                        key={test.test_id}
                        className={`hover:bg-purple-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {test.title}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700">
                            {test.class_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {formatDate(test.date)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            {formatTime(test.date)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 text-lg">
                No upcoming tests scheduled.
              </p>
              <button
                onClick={() => router.push("/create-test")}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Create a Test
              </button>
            </div>
          )}
        </div>

        {/* Completed Tests */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">✅</span>
            Recent Completed Tests
          </h2>
          {dashboardData.completedTests?.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardData.completedTests.map((test) => (
                <div
                  key={test.test_id}
                  className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-green-100 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {test.title}
                    </h3>
                    <div
                      className={`text-3xl font-extrabold ${getScoreColor(
                        test.average_score || 0
                      )}`}
                    >
                      {test.average_score || 0}%
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Class:</span>
                      <span className="text-gray-900 font-semibold">
                        {test.class_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">
                        Submission Rate:
                      </span>
                      <div className="text-right">
                        <span
                          className={`font-bold ${getSubmissionRateColor(
                            test.attempted_students,
                            test.total_students
                          )}`}
                        >
                          {test.attempted_students}/{test.total_students}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({getSubmissionRate(test)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">
                        Completed:
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatDateTime(test.date)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/test/${test.test_id}/results`)}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                  >
                    View Detailed Results →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-500 text-lg">
                No completed tests in the last 30 days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
