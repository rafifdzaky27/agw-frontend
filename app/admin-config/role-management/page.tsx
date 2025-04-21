// app/role-management/page.tsx

"use client";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RoleManagement() {
  return (
    <ProtectedRoute allowedRoles={['approver', 'master']}>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto p-6 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-4">Role Management</h1>
          <p className="text-gray-400">This is the Role Management page.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}