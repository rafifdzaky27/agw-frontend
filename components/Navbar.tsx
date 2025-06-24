"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaSun, FaMoon } from "react-icons/fa"; // Import icons for theme toggle
import { useTheme } from "@/context/ThemeContext"; // Import useTheme hook
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Change Management", href: "/change-management" },
  { name: "Governance Tasks", href: "/governance-tasks" },
  { name: "Audit Findings", href: "/audit-findings" },
  { name: "Admin Config", href: "/admin-config" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Use the theme context
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Architecture and Governance Workspace</h1>
        <ul className="flex gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`hover:text-gray-300 ${
                  pathname === link.href ? "underline" : ""
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
        {user && (
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-300" />}
            </button>
            <span className="text-sm text-gray-300 hidden md:inline">Welcome, {user.name}!</span> {/* Hide on small screens */}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
