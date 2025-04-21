// app/admin-config/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaEnvelope, FaUserCog } from "react-icons/fa"; // Import icons
import { useRouter } from 'next/navigation'; // Import useRouter

export default function AdminConfigDashboard() {
  const { user } = useAuth();
  const router = useRouter(); // Initialize useRouter

  const handleEmailConfigClick = () => {
    // Redirect to email config page
    router.push('/admin-config/email-config');
  };

  const handleRoleManagementClick = () => {
    // Redirect to role management page
    router.push('/admin-config/role-management');
  };

  return (
    <ProtectedRoute allowedRoles={['approver', 'master']}>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto p-6 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-8">Admin Configuration</h1>

          {user ? (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Email Configuration Button */}
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded flex items-center gap-2"
                onClick={handleEmailConfigClick}
              >
                <FaEnvelope className="text-xl" />
                Email Configuration
              </button>

              {/* Role Management Button */}
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded flex items-center gap-2"
                onClick={handleRoleManagementClick}
              >
                <FaUserCog className="text-xl" />
                Role Management
              </button>
            </div>
          ) : (
            <p className="text-red-500 mt-6">No user data found. Please log in.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}