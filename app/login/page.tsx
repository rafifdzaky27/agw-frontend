"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaSun, FaMoon } from "react-icons/fa";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.loading("Logging in...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_IP}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

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
    <div className="h-screen w-full flex flex-col md:flex-row-reverse relative">
      {/* Theme Toggle Button - Bottom Left */}
      <button
        onClick={toggleTheme}
        className="absolute bottom-4 left-4 p-3 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition duration-200 shadow-lg z-10"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <FaSun className="text-yellow-400" size={20} /> : <FaMoon className="text-gray-600" size={20} />}
      </button>
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 bg-blue-600 dark:bg-blue-900 text-white dark:text-blue-100">
        <div className="flex flex-col gap-2 md:gap-4 w-full md:w-3/4 p-4 md:p-0 text-start">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xl md:text-4xl font-extrabold"
          >
            Architecture & Governance Workspace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-sm md:text-xl font-light"
          >
            The essential tool for managing daily operations such as project/RFC
            registration, Change Advisory Board activities, and audit findings
            monitoring. This platform is the go-to hub for optimizing governance
            and ensuring smooth project execution with seamless coordination and
            oversight.
          </motion.p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 py-5 md:py-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full md:w-3/4 px-4 md:py-0"
        >
          <h2 className="text-3xl font-bold mb-6">Login</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="block font-medium">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter username"
                className="w-full px-4 py-2 border rounded-lg bg-slate-200 text-black focus:ring focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 mb-3">
              <label className="block font-medium ">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                className="w-full px-4 py-2 border rounded-lg bg-slate-200 text-black focus:ring focus:ring-blue-500"
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
    </div>
  );
}
