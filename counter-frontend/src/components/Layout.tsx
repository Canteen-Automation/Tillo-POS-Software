import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  History, 
  Layers, 
  Package, 
  LogOut,
  Menu,
  Bell,
  Search,
  User
} from 'lucide-react';

import CollegeLogo from '../assets/college-logo.png';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = sessionStorage.getItem('counterUserName') || 'Counter User';

  const handleLogout = () => {
    sessionStorage.removeItem('isCounterLoggedIn');
    navigate('/login');
  };

  const navItems = [
    { path: '/pos', icon: ShoppingBag, label: 'POS' },
    { path: '/orders', icon: History, label: 'Orders' },
    { path: '/categories', icon: Layers, label: 'Categories' },
    { path: '/products', icon: Package, label: 'Products' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-inter overflow-hidden h-screen">
      {/* Side Navigation Bar */}
      <aside className="w-64 bg-[#001828] text-white flex flex-col shadow-2xl z-50">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center border border-white/20 shadow-xl overflow-hidden w-full max-w-[180px]">
              <img src={CollegeLogo} alt="Logo" className="h-12 w-auto object-contain" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-white">TILLO COUNTER</span>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Institutional POS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-white/50'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 group cursor-pointer relative">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10">
                <User size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black truncate">{userName}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Operator</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header for Mobile/Search/Notifications */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-6 py-2.5 gap-4 w-full max-w-xl focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search anything here..." 
              className="bg-transparent border-none outline-none text-sm font-medium w-full"
            />
          </div>

          <div className="flex items-center gap-6">
             <button className="relative w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                <Bell size={20} />
                <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
