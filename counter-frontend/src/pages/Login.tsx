import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CollegeLogo from '../assets/college-logo.png';
import RitChennaiLogo from '../assets/ritchennai.webp';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem('isCounterLoggedIn');
    sessionStorage.removeItem('counterUserName');
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === 'krishna' && password === '12345678') {
      sessionStorage.setItem('isCounterLoggedIn', 'true');
      sessionStorage.setItem('counterUserName', 'Krishna');
      navigate('/pos');
    } else {
      alert('Invalid credentials');
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
          className="mb-10"
        >
          <img src={CollegeLogo} alt="College Logo" className="h-16 md:h-20 object-contain" />
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
              Counter Management System
            </h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">
                Operator ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8] group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-white border-2 border-[#e2e8f0] focus:border-primary rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold outline-none transition-all placeholder:text-[#cbd5e1]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">
                  Passcode
                </label>
                <button type="button" className="text-[10px] font-black text-primary uppercase hover:underline">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8] group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-[#e2e8f0] focus:border-primary rounded-2xl py-4 pl-12 pr-12 text-sm font-semibold outline-none transition-all placeholder:text-[#cbd5e1]"
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
              className="w-full bg-primary text-white rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden group relative"
            >
              <span className="relative z-10">CONNECT TO POS</span>
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
            © 2026 TILLO • COUNTER SYSTEM
          </p>
        </div>
      </div>

      {/* Right Section: Visual (Building Photo) */}
      <div className="hidden md:flex flex-1 relative bg-[#f8fafc] items-center justify-center p-8 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full h-full relative z-10"
        >
          <div className="w-full h-full overflow-hidden shadow-2xl border-[12px] border-white bg-white">
            <img
              src={RitChennaiLogo}
              alt="Tillo Building"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
