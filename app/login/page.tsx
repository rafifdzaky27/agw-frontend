"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.loading("Logging in...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_IP}/api/auth/login`, {
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

      login(data.user, data.token);

      router.push("/dashboard");
    } catch (error) {
      toast.dismiss();
      toast.error("Something went wrong. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-white mb-8"
      >
        Change Advisory Board
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-8 bg-gray-800 bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-xl max-w-sm w-full"
      >
        <h2 className="text-3xl font-bold text-center text-white mb-6">Welcome Back</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-white focus:ring focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full px-4 py-2 border rounded-lg bg-gray-700 text-white focus:ring focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg transition-all duration-300 hover:bg-blue-700 shadow-lg"
          >
            Login
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
