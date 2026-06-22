import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import Assets
import collegeLogo from '../assets/college-logo.png';
import buildingPhoto from '../assets/ritchennai.webp';

const Login = () => {
  const [role, setRole] = useState<'manager' | 'master'>('manager');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Ensure any previous session is completely wiped out when arriving at the login screen
  useEffect(() => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userPermissions');
    localStorage.removeItem('systemUser');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/system/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password })
      });

      if (response.ok) {
        const user = await response.json();

        // Strict Role Validation
        if ((user.role || '').toLowerCase() !== (role || '').toLowerCase()) {
          alert(`Access Denied: You are trying to login as ${(role || '').toUpperCase()}, but your credentials belong to a ${(user.role || '').toUpperCase()} account.`);
          return;
        }

        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', (user.role || '').toLowerCase());
        sessionStorage.setItem('userPermissions', JSON.stringify(user.permissions || []));

        // Persist user profile + JWT token for authenticated API calls
        localStorage.setItem('systemUser', JSON.stringify(user)); // user object now includes `token`

        navigate('/store-dashboard');
      } else {
        const error = await response.json().catch(() => ({ error: 'Invalid credentials' }));
        alert(error.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Network error - make sure backend is running');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row overflow-hidden font-inter">
      {/* Left Section: Login Form */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col p-8 md:p-12 lg:p-16 relative z-10 bg-white shadow-2xl">
        {/* Top Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <img src={collegeLogo} alt="College Logo" className="h-16 md:h-20 object-contain" />
        </motion.div>

        {/* Login Container */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
        >
          <div className="text-center mb-10">
            <h2 className="text-[10px] font-black tracking-[0.3em] text-[#1e293b] uppercase mb-2">
              Canteen Management System
            </h2>
            <div className="w-12 h-1 bg-[#001828] mx-auto rounded-full"></div>
          </div>

          {/* Role Toggle */}
          <div className="bg-[#f1f5f9] p-1.5 rounded-2xl flex gap-1 mb-8 relative">
            <motion.div
              className="absolute h-[calc(100%-12px)] top-1.5 bg-white rounded-xl shadow-sm z-0"
              initial={false}
              animate={{
                left: role === 'manager' ? '6px' : '50%',
                width: 'calc(50% - 9px)'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setRole('manager')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all relative z-10 ${role === 'manager' ? 'text-[#001828]' : 'text-[#94a3b8] hover:text-[#64748b]'
                }`}
            >
              <UserCircle2 size={16} />
              MANAGER
            </button>
            <button
              onClick={() => setRole('master')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all relative z-10 ${role === 'master' ? 'text-[#001828]' : 'text-[#94a3b8] hover:text-[#64748b]'
                }`}
            >
              <ShieldCheck size={16} />
              MASTER
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">
                Secure User ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8] group-focus-within:text-[#001828] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-white border-2 border-[#e2e8f0] focus:border-[#001828] rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold outline-none transition-all placeholder:text-[#cbd5e1]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">
                  Passcode
                </label>
                <button type="button" className="text-[10px] font-black text-[#001828] uppercase hover:underline">
                  Forgot Access?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8] group-focus-within:text-[#001828] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-[#e2e8f0] focus:border-[#001828] rounded-2xl py-4 pl-12 pr-12 text-sm font-semibold outline-none transition-all placeholder:text-[#cbd5e1]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#001828] text-white rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden group relative"
            >
              <span className="relative z-10">CONNECT TO PORTAL</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <motion.div
                className="absolute inset-0 bg-white/10"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <div className="mt-auto text-center">
          <p className="text-[10px] font-black text-[#cbd5e1] uppercase tracking-[0.2em]">
            © 2026 TILLO • SYSTEM PORTAL
          </p>
        </div>
      </div>

      {/* Right Section: Visual */}
      <div className="hidden md:flex flex-1 relative bg-[#f8fafc] items-center justify-center p-8 overflow-hidden">

        {/* Decorative Circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#001828]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-[#001828]/5 rounded-full blur-3xl"></div>

        {/* Image Container with Custom Shape (using clip-path or rounded corners) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full h-full relative z-10"
        >
          <div className="w-full h-full overflow-hidden shadow-2xl border-[12px] border-white bg-white">
            <img
              src={buildingPhoto}
              alt="Tillo Building"
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#001828]/20 to-transparent"></div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default Login;
