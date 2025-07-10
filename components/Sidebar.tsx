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
  FaChevronRight,
  FaBriefcase,
  FaChevronDown,
  FaChevronUp,
  FaShieldAlt,
  FaCogs,
  FaSitemap,
  FaFileAlt
} from "react-icons/fa";

// Define navigation items with icons for better UX
const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: FaHome },
  { name: "Memo Manager", href: "/memo-manager", icon: FaFileAlt },
];

// Define dropdown sections
const DROPDOWN_SECTIONS = [
  {
    name: "IT Governance",
    icon: FaShieldAlt,
    items: [
      { name: "Governance Workload", href: "/it-governance/governance-workload" },
      { name: "Audit Findings", href: "/it-governance/audit-findings" },
      { name: "Audit Universe", href: "/it-governance/audit-universe" },
      { name: "Policy Management", href: "/it-governance/policy-management" },
    ]
  },
  {
    name: "IT Management",
    icon: FaCogs,
    items: [
      { name: "Management Workload", href: "/it-management/it-management-workload" },
      { name: "Change Management", href: "/it-management/change-management" },
      { name: "Vendor Management", href: "/it-management/vendor-management" },
      { name: "Portfolio Management", href: "/it-management/portfolio-management" },
      { name: "Finance Management", href: "/it-management/finance-management" },
    ]
  },
  {
    name: "IT Architecture",
    icon: FaSitemap,
    items: [
      { name: "Architecture Workload", href: "/it-architecture/it-architecture-workload" },
    ]
  }
];

// Define admin items (placed at bottom)
const ADMIN_ITEMS = [
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
  
  // State for dropdown sections
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [manuallyClosedDropdowns, setManuallyClosedDropdowns] = useState<Record<string, boolean>>({});
  
  // Auto-open dropdowns with active items on route change, but respect manual close
  useEffect(() => {
    const newOpenDropdowns = { ...openDropdowns };
    DROPDOWN_SECTIONS.forEach(section => {
      if (isDropdownItemActive(section.items) && !manuallyClosedDropdowns[section.name]) {
        newOpenDropdowns[section.name] = true;
      }
    });
    setOpenDropdowns(newOpenDropdowns);
    // Reset manual close state when route changes
    setManuallyClosedDropdowns({});
  }, [pathname]);
  
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

  const toggleDropdown = (sectionName: string) => {
    const isCurrentlyOpen = openDropdowns[sectionName];
    const hasActiveItem = isDropdownItemActive(DROPDOWN_SECTIONS.find(s => s.name === sectionName)?.items || []);
    
    setOpenDropdowns(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
    
    // Track manual close for sections with active items
    if (isCurrentlyOpen && hasActiveItem) {
      setManuallyClosedDropdowns(prev => ({
        ...prev,
        [sectionName]: true
      }));
    }
  };

  const isDropdownItemActive = (sectionItems: { href: string }[]) => {
    return sectionItems.some(item => {
      // Handle exact matches for specific routes
      if (item.href === '/change-management' || 
          item.href === '/it-management/portfolio-management') {
        return pathname === item.href;
      }
      // Handle prefix matches for other routes
      return pathname.startsWith(item.href) && item.href !== '/';
    });
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white md:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-transform duration-300 ease-in-out z-40 border-r border-gray-200 dark:border-gray-800
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-56 md:w-60 shadow-xl flex flex-col
          ${className}
        `}
      >
        {/* Logo/Title */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-lg font-bold text-center">Architecture and Governance Workspace</h1>
        </div>      
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <ul className="space-y-2 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white shadow-md' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}
                    `}
                  >
                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-700 dark:bg-blue-800 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      <Icon size={16} />
                    </div>
                    <span className="font-medium whitespace-pre-line flex-1">{item.name}</span>
                    <div className="w-3 flex justify-center">
                      {isActive && (
                        <FaChevronRight size={12} className="text-blue-300" />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
            
            {/* Dropdown Sections */}
            {DROPDOWN_SECTIONS.map((section) => {
              const isDropdownOpen = openDropdowns[section.name];
              const hasActiveItem = isDropdownItemActive(section.items);
              const SectionIcon = section.icon;
              
              return (
                <li key={section.name} className="mt-4">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleDropdown(section.name)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${hasActiveItem 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white shadow-md' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}
                    `}
                  >
                    <div className={`p-1.5 rounded-md ${hasActiveItem ? 'bg-blue-700 dark:bg-blue-800 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      <SectionIcon size={16} />
                    </div>
                    <span className="font-medium flex-1 text-left leading-tight">{section.name}</span>
                    <div className="w-3 flex justify-center">
                      {isDropdownOpen ? (
                        <FaChevronUp size={12} className={hasActiveItem ? 'text-blue-300' : 'text-gray-400'} />
                      ) : (
                        <FaChevronDown size={12} className={hasActiveItem ? 'text-blue-300' : 'text-gray-400'} />
                      )}
                    </div>
                  </button>
                  
                  {/* Dropdown Items */}
                  {(isDropdownOpen || (hasActiveItem && !manuallyClosedDropdowns[section.name])) && (
                    <ul className="mt-2 ml-4 space-y-1">
                      {section.items.map((item) => {
                        const isItemActive = pathname === item.href;
                        
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={`
                                flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                                ${isItemActive 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500 text-white shadow-sm' 
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}
                              `}
                            >
                              <div className={`w-2 h-2 rounded-full ${isItemActive ? 'bg-blue-200' : 'bg-gray-400 dark:bg-gray-600'}`}></div>
                              <span className="font-medium flex-1 leading-tight">{item.name}</span>
                              <div className="w-3 flex justify-center">
                                {isItemActive && (
                                  <FaChevronRight size={10} className="text-blue-200" />
                                )}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
            
            {/* Admin Items - Placed at bottom */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {ADMIN_ITEMS.map((item) => {
                const isActive = item.href === '/admin-config' ? pathname.startsWith(item.href) : pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white shadow-md' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}
                      `}
                    >
                      <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-700 dark:bg-blue-800 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-medium flex-1">{item.name}</span>
                      <div className="w-3 flex justify-center">
                        {isActive && (
                          <FaChevronRight size={12} className="text-blue-300" />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </div>
          </ul>
        </nav>  
        
        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
         {/* User Info and Theme Toggle */}
         {user && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Welcome,</p>
              <p className="text-sm font-medium truncate">{user.name}</p>
            </div>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <FaSun className="text-yellow-400" size={16} /> : <FaMoon className="text-gray-600" size={16} />}
            </button>
          </div>
        )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 hover:from-red-700 hover:to-red-600 dark:hover:from-red-800 dark:hover:to-red-700 text-white font-medium shadow-md transition-all duration-200"
          >
            <FaSignOutAlt size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
