// app/unauthorized/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link"; // Import Link component

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />
      <div className="container mx-auto p-6 flex-grow flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Unauthorized</h1>
          <p className="text-gray-400 mb-6">
            You do not have permission to access this page.
          </p>
          <Link href="/dashboard" className="text-blue-500 hover:underline">
            Go back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}