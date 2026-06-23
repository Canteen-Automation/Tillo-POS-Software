import { apiFetch } from '../api';
import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  Settings,
  HelpCircle,
  Calendar,
  LayoutDashboard,
  Store,
  ShoppingBag,
  History,
  Users,
  Package,
  Layers,
  FileText,
  MessageSquare,
  Wallet,
  Ticket,
  Cpu,
  UserCheck,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PAGES = [
  { label: 'General Dashboard', path: '/dashboard', category: 'Analytics', icon: <LayoutDashboard size={14} /> },
  { label: 'Store Dashboard', path: '/store-dashboard', category: 'Analytics', icon: <Store size={14} /> },
  { label: 'Active Orders', path: '/sale/orders', category: 'Sales', icon: <ShoppingBag size={14} /> },
  { label: 'Archived Bills', path: '/sale/archived-bills', category: 'Sales', icon: <History size={14} /> },
  { label: 'Manage Products', path: '/inventory/products', category: 'Inventory', icon: <Package size={14} /> },
  { label: 'Base Menu', path: '/inventory/base', category: 'Inventory', icon: <Layers size={14} /> },
  { label: 'Ritz Overview', path: '/ritz/overview', category: 'Finance', icon: <Wallet size={14} /> },
  { label: 'Manage Wallets', path: '/ritz/wallets', category: 'Finance', icon: <Users size={14} /> },
  { label: 'Coupon Codes', path: '/ritz/coupons', category: 'Finance', icon: <Ticket size={14} /> },
  { label: 'Reports & Analytics', path: '/reports', category: 'Support', icon: <FileText size={14} /> },
  { label: 'Customer Feedback', path: '/feedback', category: 'Support', icon: <MessageSquare size={14} /> },
  { label: 'Staff Management', path: '/stores/staffs', category: 'Team', icon: <UserCheck size={14} /> },
  { label: 'Store Terminals', path: '/stores/terminals', category: 'System', icon: <Cpu size={14} /> },
  { label: 'System Settings', path: '/settings', category: 'System', icon: <Settings size={14} /> },
];

const Header = () => {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredPages = PAGES.filter(page =>
    page.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch(`http://${window.location.hostname}:8080/api/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && showResults) {
      setSelectedIndex(prev => (prev + 1) % filteredPages.length);
    } else if (e.key === 'ArrowUp' && showResults) {
      setSelectedIndex(prev => (prev - 1 + filteredPages.length) % filteredPages.length);
    } else if (e.key === 'Enter' && showResults && filteredPages[selectedIndex]) {
      handleNavigate(filteredPages[selectedIndex].path);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setShowNotifications(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      await apiFetch(`http://${window.location.hostname}:8080/api/notifications/mark-read/${notif.id}`, { method: 'POST' });
      if (notif.link) navigate(notif.link);
      setShowNotifications(false);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch(`http://${window.location.hostname}:8080/api/notifications/mark-all-read`, { method: 'POST' });
      fetchNotifications();
      setShowNotifications(false);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FEEDBACK': return <MessageSquare size={16} className="text-emerald-500" />;
      case 'PURCHASE': return <ShoppingBag size={16} className="text-indigo-500" />;
      case 'PRODUCT': return <Package size={16} className="text-amber-500" />;
      case 'COUPON': return <Ticket size={16} className="text-rose-500" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative group w-full max-w-md" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] group-focus-within:text-[#003317] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search pages, settings, or analytics..."
            className="w-full bg-gray-50 border border-transparent rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:border-[#003317]/30 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleKeyDown}
          />

          <AnimatePresence>
            {showResults && searchTerm && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-[#e2e8f0] rounded-xl shadow-2xl overflow-hidden z-50"
              >
                {filteredPages.length > 0 ? (
                  <div className="py-2">
                    {filteredPages.map((page, index) => (
                      <button
                        key={page.path}
                        onClick={() => handleNavigate(page.path)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors ${index === selectedIndex ? 'bg-[#003317]/5' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg transition-colors ${index === selectedIndex ? 'bg-[#003317] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {page.icon}
                          </div>
                          <div className="text-left">
                            <div className={`text-sm font-bold ${index === selectedIndex ? 'text-[#003317]' : 'text-slate-700'}`}>
                              {page.label}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest font-black opacity-40">
                              {page.category}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`transition-transform duration-300 ${index === selectedIndex ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} size={14} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <HelpCircle className="mx-auto text-slate-200 mb-2" size={32} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching pages found</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 text-[#64748b] text-sm">
          <Calendar size={16} />
          <span>{currentDate}</span>
        </div>

        <div className="flex items-center gap-4 border-l border-[#e2e8f0] pl-6">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-lg transition-all group ${showNotifications ? 'bg-indigo-50 text-[#003317]' : 'text-[#64748b] hover:text-[#1e293b] hover:bg-gray-100'}`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl border border-[#e2e8f0] rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className="w-full p-4 border-b border-gray-50 hover:bg-gray-50/80 transition-colors flex gap-3 text-left group"
                        >
                          <div className="mt-1 shrink-0 p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-indigo-100 transition-colors">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-slate-800 mb-0.5 truncate">{notif.title}</div>
                            <div className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">{notif.message}</div>
                            <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bell size={24} className="text-slate-200" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All caught up!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/settings" className="p-2 text-[#64748b] hover:text-[#003317] hover:bg-indigo-50 rounded-lg transition-all">
            <Settings size={20} />
          </Link>

          <button className="p-2 text-[#64748b] hover:text-[#1e293b] hover:bg-gray-100 rounded-lg transition-all">
            <HelpCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
