"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext"; 
import { useRouter } from "next/navigation"; 

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    toast.loading("Logging in...");

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Login failed");
        return;
      }

      const data = await response.json();

      toast.success("Login successful");

      login(data.user, data.token); // Store user & token in context/localStorage

      router.push("/dashboard");
    } catch (error) {
      toast.dismiss();
      toast.error("Something went wrong. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <form onSubmit={handleLogin} className="p-6 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-white">Login</h2>
  
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300">Username</label>
          <input
            type="text"
            placeholder="username"
            className="w-full px-4 py-2 border rounded-md bg-gray-700 text-white focus:ring focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
  
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300">Password</label>
          <input
            type="password"
            placeholder="password"
            className="w-full px-4 py-2 border rounded-md bg-gray-700 text-white focus:ring focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
  
        <button
          type="submit"
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
