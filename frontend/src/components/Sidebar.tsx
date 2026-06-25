import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronRight,
  Gauge,
  LayoutGrid,
  MessageSquare,
  ShoppingCart,
  Store,
  Users,
  ShoppingBag,
  Receipt,
  Search,
  LogOut,
  CircleDollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import collegeLogo from '../assets/college-logo.png';
import colorVector from '../assets/color-vector.png';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SubMenuItem {
  title: string;
  path?: string;
  nestedMenu?: { title: string; path: string }[];
}

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  subMenu?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: Gauge, path: '/dashboard' },
  { title: 'Store Dashboard', icon: LayoutGrid, path: '/store-dashboard' },
  {
    title: 'Sale',
    icon: Receipt,
    subMenu: [
      { title: 'Orders', path: '/sale/orders' },
      { title: 'Archived Bills', path: '/sale/archived-bills' }
    ]
  },
  {
    title: 'Customers',
    icon: Users,
    subMenu: [
      { title: 'Orders', path: '/customers/orders' }
    ]
  },
  {
    title: 'Purchases',
    icon: ShoppingBag,
    subMenu: [
      {
        title: 'Vendor',
        nestedMenu: [
          { title: 'Dashboard', path: '/purchases/dashboard' },
          { title: 'Orders', path: '/purchases/orders' },
          { title: 'Summary', path: '/purchases/summary' },
          { title: 'Bills', path: '/purchases/bills' },
          { title: 'Vendors', path: '/purchases/vendor' },
          { title: 'Purchase Analytics', path: '/purchases/analytics' }
        ]
      },
      {
        title: 'Intent',
        nestedMenu: [
          { title: 'Orders Dashboard', path: '/purchases/intent/orders-dashboard' },
          { title: 'Receives Dashboard', path: '/purchases/intent/receives-dashboard' },
          { title: 'Orders', path: '/purchases/intent/orders' },
          { title: 'Receives', path: '/purchases/intent/receives' }
        ]
      }
    ]
  },
  {
    title: 'Inventory',
    icon: ShoppingCart,
    subMenu: [
      { title: 'New Arrivals', path: '/inventory/new-arrivals' },
      { title: 'Base Items', path: '/inventory/base' },
      { title: 'Products', path: '/inventory/products' }
    ]
  },
  { title: 'Reports', icon: BarChart3, path: '/reports' },
  {
    title: 'Stores',
    icon: Store,
    subMenu: [
      { title: 'Terminals', path: '/stores/terminals' },
      { title: 'Managers', path: '/stores/managers' },
      { title: 'Staffs', path: '/stores/staffs' },
      { title: 'Stalls', path: '/stores/stalls' }
    ]
  },
  { title: 'Feedback', icon: MessageSquare, path: '/feedback' },
  {
    title: 'Ritz',
    icon: CircleDollarSign,
    subMenu: [
      { title: 'Overview', path: '/ritz/overview' },
      { title: 'Ritz in Circulation', path: '/ritz/circulation' },
      { title: 'Manage Wallets', path: '/ritz/wallets' },
      { title: 'Coupon Codes', path: '/ritz/coupons' }
    ]
  },
];

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [openNestedMenus, setOpenNestedMenus] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Permission Logic
  const userRole = sessionStorage.getItem('userRole') || 'master';
  const userPermissions = JSON.parse(sessionStorage.getItem('userPermissions') || '[]');

  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === 'master') return true;

    // Map title to permission ID
    const permissionMap: Record<string, string> = {
      'Dashboard': 'dashboard',
      'Store Dashboard': 'dashboard',
      'Sale': 'sale',
      'Customers': 'customers',
      'Purchases': 'purchases',
      'Inventory': 'inventory',
      'Reports': 'reports',
      'Stores': 'stores',
      'Feedback': 'feedback',
      'Ritz': 'ritz'
    };

    return userPermissions.includes(permissionMap[item.title]);
  });

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userPermissions');
    localStorage.removeItem('systemUser');
    navigate('/login');
  };

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const toggleNestedMenu = (title: string) => {
    setOpenNestedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  // Check if a sub-menu should be open based on the current location
  React.useEffect(() => {
    const currentMenu = menuItems.find(item =>
      item.subMenu?.some(sub => location.pathname.startsWith(sub.path || ''))
    );
    if (currentMenu && !openMenus.includes(currentMenu.title)) {
      setOpenMenus(prev => [...prev, currentMenu.title]);
    }
  }, [location.pathname]);

  return (
    <div className="w-64 bg-white h-screen border-r border-[#e2e8f0] flex flex-col fixed left-0 top-0 z-50 shadow-sm overflow-hidden font-inter">
      {/* Branding Section */}
      <div className="px-5 pt-8 pb-4 flex flex-col justify-center items-center w-full">
        <img src={collegeLogo} alt="Branding" className="h-14 w-auto object-contain brightness-[1.05]" />
        <span className="text-[10px] font-semibold text-slate-400 mt-1 italic tracking-wide font-sans">
          Till yo tummy is full...
        </span>
      </div>
      {/* Premium Search Integration (Modern Dashboards usually have this) */}
      <div className="px-3 mb-4">
        <div className="relative flex items-center group">
          <div className="absolute left-3 flex items-center justify-center pointer-events-none">
            <Search size={16} className="text-[#64748b] group-focus-within:text-[#001828] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search Menu..."
            title="Search for a specific module or page"
            className="w-full h-10 bg-gray-50 border border-[#e2e8f0] rounded-xl pl-10 pr-4 text-[13px] font-medium outline-none transition-all focus:bg-white focus:border-[#001828]/30 focus:shadow-sm placeholder:text-[#94a3b8] text-[#1e293b]"
          />
        </div>
      </div>

      {/* The main dashboard list starts here */}

      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => (
            <li key={item.title}>
              {item.subMenu ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    title={`Expand/Collapse ${item.title}`}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group",
                      openMenus.includes(item.title)
                        ? "text-[#003317] bg-[#003317]/5"
                        : "text-[#475569] hover:bg-gray-50 hover:text-[#1e293b]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} strokeWidth={2} className={cn(
                        "transition-colors",
                        openMenus.includes(item.title) ? "text-[#003317]" : "text-[#64748b] group-hover:text-[#475569]"
                      )} />
                      <span className="tracking-tight">{item.title}</span>
                    </div>
                    <div className={cn(
                      "transition-transform duration-300",
                      openMenus.includes(item.title) ? "rotate-90" : ""
                    )}>
                      <ChevronRight size={14} className="opacity-60" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openMenus.includes(item.title) && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="ml-6 mt-1 mb-2 space-y-0.5 border-l border-[#e2e8f0]/60 overflow-hidden"
                      >
                        {item.subMenu.map((sub) => (
                          <li key={sub.title}>
                            {sub.nestedMenu ? (
                              <div>
                                <button
                                  onClick={() => toggleNestedMenu(sub.title)}
                                  className={cn(
                                    "w-full flex items-center justify-between py-2 px-4 rounded-lg text-[13px] font-medium transition-all group",
                                    openNestedMenus.includes(sub.title) ? "text-[#003317] bg-[#003317]/5" : "text-[#64748b] hover:text-[#1e293b]"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      openNestedMenus.includes(sub.title) ? "bg-[#003317]" : "bg-gray-300"
                                    )} />
                                    <span>{sub.title}</span>
                                  </div>
                                  <ChevronRight size={12} className={cn(
                                    "transition-transform duration-200",
                                    openNestedMenus.includes(sub.title) ? "rotate-90" : ""
                                  )} />
                                </button>

                                <AnimatePresence>
                                  {openNestedMenus.includes(sub.title) && (
                                    <motion.ul
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="ml-4 mt-1 space-y-0.5 border-l border-[#e2e8f0]/60 overflow-hidden"
                                    >
                                      {sub.nestedMenu.map((nested) => (
                                        <li key={nested.title}>
                                          <NavLink
                                            to={nested.path!}
                                            className={({ isActive }) => cn(
                                              "flex items-center gap-3 py-1.5 px-4 rounded-lg text-[12px] font-medium transition-all",
                                              isActive ? "text-[#003317] bg-white shadow-sm" : "text-[#64748b] hover:text-[#1e293b]"
                                            )}
                                          >
                                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>{nested.title}</span>
                                          </NavLink>
                                        </li>
                                      ))}
                                    </motion.ul>
                                  )}
                                </AnimatePresence>
                              </div>
                            ) : (
                              <NavLink
                                to={sub.path!}
                                title={`Go to ${sub.title}`}
                                className={({ isActive }) => cn(
                                  "flex items-center gap-3 py-2 px-4 rounded-lg text-[13px] font-medium transition-all group relative",
                                  isActive
                                    ? "text-white bg-[#003317] shadow-md shadow-[#003317]/10"
                                    : "text-[#64748b] hover:text-[#1e293b] hover:translate-x-1"
                                )}
                              >
                                {({ isActive }) => (
                                  <>
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                      isActive ? "bg-[#003317] scale-125" : "bg-gray-300 group-hover:bg-gray-400"
                                    )} />
                                    <span>{sub.title}</span>
                                    {isActive && (
                                      <motion.div
                                        layoutId="activeSubMenu"
                                        className="absolute left-[-1.5px] top-1/4 bottom-1/4 w-[3px] bg-[#003317] rounded-full"
                                      />
                                    )}
                                  </>
                                )}
                              </NavLink>
                            )}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink
                  to={item.path!}
                  title={`Go to ${item.title}`}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group",
                    isActive
                      ? "bg-[#003317] text-white shadow-lg shadow-[#003317]/15"
                      : "text-[#475569] hover:bg-gray-50 hover:text-[#1e293b]"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {item.title === 'Ritz' ? (
                        <div className={cn(
                          "w-5 h-5 rounded-lg overflow-hidden flex items-center justify-center p-0.5",
                          isActive ? "bg-white/20" : "bg-slate-100"
                        )}>
                          <img src={colorVector} alt="" className="w-full h-full object-cover rounded-sm" />
                        </div>
                      ) : (
                        <item.icon size={18} strokeWidth={2} className={cn(
                          "transition-colors",
                          isActive ? "text-white" : "text-[#64748b] group-hover:text-[#475569]"
                        )} />
                      )}
                      <span className="tracking-tight">{item.title}</span>
                    </>
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 bg-gray-50/50 border-t border-[#e2e8f0]">
        <button
          onClick={handleLogout}
          title="Sign out of your account"
          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all font-semibold text-sm group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
      ` }} />
    </div>
  );
};

export default Sidebar;
