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

  // 🔹 Utility functions
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

  // 🔹 Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth");
          return;
        }

        // Try direct API call first, fallback to mock data
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        try {
          const response = await fetch(`${apiUrl}/teacher-dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            if (response.status === 401) {
              localStorage.removeItem("token");
              router.push("/auth");
            }
            const errorText = await response.text();
            console.error("API Error:", response.status, errorText);
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log("Dashboard data received:", data);
          setDashboardData(data);
        } catch (fetchError) {
          console.warn("API not available, using mock data:", fetchError);
          // Mock data for development
          const mockData: TeacherDashboardData = {
            teacher: {
              name: "John Doe",
              email: "john.doe@example.com",
              id: "T001",
            },
            statistics: {
              total_classes: 3,
              total_students: 45,
              upcoming_tests: 2,
              completed_tests: 8,
            },
            classes: [
              {
                class_id: "C001",
                class_name: "Mathematics 101",
                class_code: "MATH101",
                student_count: 25,
              },
              {
                class_id: "C002",
                class_name: "Physics 201",
                class_code: "PHYS201",
                student_count: 20,
              },
            ],
            upcomingTests: [
              {
                test_id: "T001",
                title: "Midterm Exam",
                class_name: "Mathematics 101",
                date: new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(),
              },
            ],
            completedTests: [
              {
                test_id: "T002",
                title: "Quiz 1",
                class_name: "Physics 201",
                attempted_students: 18,
                total_students: 20,
                average_score: 85,
                date: new Date(
                  Date.now() - 3 * 24 * 60 * 60 * 1000
                ).toISOString(),
              },
            ],
          };
          setDashboardData(mockData);
        }
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

  // 🔹 Loading state
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  // 🔹 Error state
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );

  if (!dashboardData)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        No dashboard data available
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-indigo-700 mb-8">
          Teacher Dashboard
        </h1>

        {/* Teacher Info */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Teacher Information
          </h2>
          <div className="bg-gray-100 rounded-lg p-4">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {dashboardData.teacher?.name}
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              {dashboardData.teacher?.email}
            </p>
            <p>
              <span className="font-medium">ID:</span>{" "}
              {dashboardData.teacher?.id}
            </p>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold">Total Classes</h3>
              <p className="text-2xl text-indigo-700">
                {dashboardData.statistics?.total_classes || 0}
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold">Total Students</h3>
              <p className="text-2xl text-indigo-700">
                {dashboardData.statistics?.total_students || 0}
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold">Upcoming Tests</h3>
              <p className="text-2xl text-indigo-700">
                {dashboardData.statistics?.upcoming_tests || 0}
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold">Completed Tests</h3>
              <p className="text-2xl text-indigo-700">
                {dashboardData.statistics?.completed_tests || 0}
              </p>
            </div>
          </div>
        </section>

        {/* Classes */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Your Classes
          </h2>
          {dashboardData.classes?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardData.classes.map((cls) => (
                <div
                  key={cls.class_id}
                  className="bg-white shadow rounded-lg p-4 border"
                >
                  <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                    {cls.class_name}
                  </h3>
                  <p>
                    <span className="font-medium">Code:</span> {cls.class_code}
                  </p>
                  <p>
                    <span className="font-medium">Students:</span>{" "}
                    {cls.student_count}
                  </p>
                  <button
                    onClick={() => router.push(`/class/${cls.class_id}`)}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Manage Class
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              You haven&apos;t created any classes yet.
            </p>
          )}
        </section>

        {/* Upcoming Tests */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Upcoming Tests
          </h2>
          {dashboardData.upcomingTests?.length ? (
            <div className="overflow-x-auto bg-white shadow rounded-lg">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="p-2">Test</th>
                    <th className="p-2">Class</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Time (PKT)</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.upcomingTests.map((test) => (
                    <tr key={test.test_id} className="border-b">
                      <td className="p-2">{test.title}</td>
                      <td className="p-2">{test.class_name}</td>
                      <td className="p-2">{formatDate(test.date)}</td>
                      <td className="p-2">{formatTime(test.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No upcoming tests scheduled.</p>
          )}
        </section>

        {/* Completed Tests */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Recent Completed Tests
          </h2>
          {dashboardData.completedTests?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardData.completedTests.map((test) => (
                <div
                  key={test.test_id}
                  className="bg-white shadow rounded-lg p-4 border"
                >
                  <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                    {test.title}
                  </h3>
                  <p>
                    <span className="font-medium">Class:</span>{" "}
                    {test.class_name}
                  </p>
                  <p>
                    <span className="font-medium">Submission Rate:</span>{" "}
                    {test.attempted_students}/{test.total_students} (
                    {getSubmissionRate(test)})
                  </p>
                  <p>
                    <span className="font-medium">Average Score:</span>{" "}
                    {test.average_score || "N/A"}%
                  </p>
                  <p>
                    <span className="font-medium">Completed On:</span>{" "}
                    {formatDateTime(test.date)}
                  </p>
                  <button
                    onClick={() => router.push(`/test/${test.test_id}/results`)}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    View Detailed Results
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              No completed tests in the last 30 days.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
