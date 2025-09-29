"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardData {
  student: {
    name: string;
    email: string;
    id: string;
  };
  availableTests: {
    test_id: string;
    test_title: string;
    class_id: string;
    class_name: string;
    date: string;
    disable_time: string;
  }[];
  upcomingTests: {
    test_id: string;
    test_title: string;
    class_name: string;
    due_date: string;
  }[];
  recentSubmissions: {
    test_id: string;
    test_title: string;
    submitted_at: string | null;
    status: string;
  }[];
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Format helpers
  const formatDateInPKT = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" });
  };

  const formatTimeInPKT = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi" });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        if (err.message.includes("401")) {
          localStorage.removeItem("token");
          router.push("/login");
        }
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        No dashboard data available
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          Student Academic Dashboard
        </h1>

        {/* Student Info */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Student Information</h2>
          <div className="bg-gray-100 rounded-lg p-4">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {dashboardData.student.name}
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              {dashboardData.student.email}
            </p>
            <p>
              <span className="font-medium">Student ID:</span>{" "}
              {dashboardData.student.id}
            </p>
          </div>
        </section>

        {/* Available Tests */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Tests Available</h2>
          {dashboardData.availableTests?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.availableTests.map((test) => (
                <div
                  key={test.test_id}
                  className="bg-indigo-50 rounded-lg p-4 shadow hover:shadow-md cursor-pointer"
                  onClick={() => router.push(`/class/${test.class_id}/student`)}
                >
                  <h3 className="font-bold text-lg">{test.test_title}</h3>
                  <p>
                    <span className="font-medium">Class:</span> {test.class_name}
                  </p>
                  <p>
                    <span className="font-medium">Start Time:</span>{" "}
                    {formatTimeInPKT(test.date)} ({formatDateInPKT(test.date)})
                  </p>
                  <p>
                    <span className="font-medium">Disable Time:</span>{" "}
                    {formatTimeInPKT(test.disable_time)} (
                    {formatDateInPKT(test.disable_time)})
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No available tests</p>
          )}
        </section>

        {/* Upcoming Tests */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Upcoming Tests</h2>
          {dashboardData.upcomingTests?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">Test</th>
                    <th className="px-4 py-2 border">Class</th>
                    <th className="px-4 py-2 border">Due Date</th>
                    <th className="px-4 py-2 border">Due Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.upcomingTests.map((test) => (
                    <tr key={test.test_id} className="text-center">
                      <td className="px-4 py-2 border">{test.test_title}</td>
                      <td className="px-4 py-2 border">{test.class_name}</td>
                      <td className="px-4 py-2 border">
                        {formatDateInPKT(test.due_date)}
                      </td>
                      <td className="px-4 py-2 border">
                        {formatTimeInPKT(test.due_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No upcoming tests</p>
          )}
        </section>

        {/* Recent Submissions */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Recent Submissions</h2>
          {dashboardData.recentSubmissions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.recentSubmissions.map((submission) => (
                <div
                  key={submission.test_id}
                  className="bg-white border rounded-lg shadow p-4"
                >
                  <h3 className="font-bold">{submission.test_title}</h3>
                  <p>
                    <span className="font-medium">Submitted At:</span>{" "}
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleString(
                          "en-PK",
                          { timeZone: "Asia/Karachi" }
                        )
                      : "Not submitted"}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        submission.status === "Submitted"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent submissions</p>
          )}
        </section>
      </div>
    </div>
  );
}
