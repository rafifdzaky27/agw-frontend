"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Audit Findings", href: "/audit-findings" },
  { name: "Governance Tasks", href: "/governance-tasks" },
  { name: "Change Management", href: "/change-management" },
  { name: "Admin Config", href: "/admin-config" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
            <span className="text-sm text-gray-300">Welcome, {user.name}!</span>
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
