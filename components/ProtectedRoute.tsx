// components/ProtectedRoute.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];  // Optional: Roles that are allowed to access this route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login page
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Logged in, but role not allowed, redirect to unauthorized page (or homepage)
        router.push('/unauthorized'); // or router.push('/');
      }
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    // Optionally, show a loading indicator
    return <div>Loading...</div>;
  }

  // If user is authenticated and has the correct role (or no role is required), render the children
  return <>{children}</>;
};

export default ProtectedRoute;