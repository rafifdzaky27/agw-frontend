"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  const { user, token } = useAuth(); // Fetch user and token from AuthContext

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center p-6">
          <h1 className="text-3xl font-bold">Welcome to Dashboard</h1>

          {user ? (
            <div className="mt-6 text-center bg-gray-800 p-6 rounded-lg shadow-lg">
              <p className="text-xl font-semibold">Hello, {user.name}!</p>
              <p className="text-gray-400">Username: {user.username}</p>
              <p className="text-gray-400">Role: {user.role}</p>
              <p className="text-gray-400">Division: {user.division}</p>

              {/* Token Section */}
              {token && (
                <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm break-all">
                  <p className="text-gray-400">Token:</p>
                  <p className="text-green-400">{token}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-500 mt-6">No user data found. Please log in.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
