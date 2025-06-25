"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { 
  FaSun, 
  FaMoon, 
  FaBars, 
  FaTimes,
  FaHome, 
  FaExchangeAlt, 
  FaTasks, 
  FaClipboardCheck, 
  FaCog,
  FaSignOutAlt,
  FaChevronRight
} from "react-icons/fa";

// Define navigation items with icons for better UX
const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: FaHome },
  { name: "Change Management", href: "/change-management", icon: FaExchangeAlt },
  { name: "Governance Tasks", href: "/governance-tasks", icon: FaTasks },
  { name: "Audit Findings", href: "/audit-findings", icon: FaClipboardCheck },
  { name: "Admin Config", href: "/admin-config", icon: FaCog },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  
  // State for responsive sidebar
  const [isOpen, setIsOpen] = useState(false);
  
  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  
  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      if (
        isOpen && 
        sidebar && 
        toggleButton && 
        !sidebar.contains(event.target as Node) && 
        !toggleButton.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-700 text-white md:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`
          fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-56 md:w-60 shadow-xl flex flex-col
          ${className}
        `}
      >
        {/* Logo/Title */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-center text-white">Architecture and Governance Workspace</h1>
        </div>      
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md' 
                        : 'hover:bg-gray-800 text-gray-300 hover:text-white'}
                    `}
                  >
                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-800 text-white' : 'bg-gray-800 text-gray-400'}`}>
                      <Icon size={16} />
                    </div>
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <FaChevronRight size={12} className="ml-auto text-blue-300" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>  
        
        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800">
         {/* User Info and Theme Toggle */}
         {user && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-gray-400 font-medium">Welcome,</p>
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
            </div>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <FaSun className="text-yellow-400" size={16} /> : <FaMoon className="text-gray-300" size={16} />}
            </button>
          </div>
        )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-medium shadow-md transition-all duration-200"
          >
            <FaSignOutAlt size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
