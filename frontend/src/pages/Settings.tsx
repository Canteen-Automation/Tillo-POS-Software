import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Key,
  Users,
  UserPlus,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('systemUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    password: '',
    confirmPassword: ''
  });

  // Team State
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'MASTER' });
  const [showAddModal, setShowAddModal] = useState(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'team') {
      fetchAdmins();
    }
  }, [activeTab]);

  const fetchAdmins = async () => {
    try {
      const [adminsRes, managersRes] = await Promise.all([
        apiFetch('/api/system/admins'),
        apiFetch('/api/system/managers')
      ]);
      const adminsData = await adminsRes.json();
      const managersData = await managersRes.json();
      const merged = [
        ...adminsData.map((a: any) => ({ ...a, role: 'MASTER' })),
        ...managersData.map((m: any) => ({ ...m, role: 'MANAGER' }))
      ];
      setAdmins(merged);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData.password && profileData.password !== profileData.confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    setStatus('loading');
    try {
      const response = await apiFetch('/api/system/update-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser?.id,
          name: profileData.name,
          email: profileData.email,
          password: profileData.password || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        const updatedUser = { ...currentUser, name: profileData.name, email: profileData.email };
        localStorage.setItem('systemUser', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Update failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Connection error');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const endpoint = newAdmin.role === 'MANAGER' ? '/api/system/managers' : '/api/system/admins';
      const payload = newAdmin.role === 'MANAGER' 
        ? {
            name: newAdmin.name,
            email: newAdmin.email,
            password: newAdmin.password,
            viewOnly: false,
            permissions: ["dashboard", "sale", "customers", "purchases", "inventory", "expense", "reports", "stores", "table", "wallet", "promotions", "feedback"]
          }
        : {
            name: newAdmin.name,
            email: newAdmin.email,
            password: newAdmin.password
          };
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatus('success');
        setMessage(newAdmin.role === 'MANAGER' ? 'New manager added' : 'New administrator added');
        setNewAdmin({ name: '', email: '', password: '', role: 'MASTER' });
        setShowAddModal(false);
        fetchAdmins();
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setMessage('Failed to add user');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Connection error');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#001828] mb-2">Settings & Security</h1>
          <p className="text-[#64748b]">Manage your account and system access control</p>
        </div>
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-white text-[#001828] shadow-sm' : 'text-[#64748b] hover:text-[#001828]'}`}
          >
            <User size={18} />
            My Account
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'team' ? 'bg-white text-[#001828] shadow-sm' : 'text-[#64748b] hover:text-[#001828]'}`}
          >
            <Users size={18} />
            Team Management
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' ? (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Card: Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#001828] to-[#6366f1] rounded-full mx-auto mb-4 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <User size={40} />
                </div>
                <h3 className="text-xl font-bold text-[#1e293b]">{currentUser?.name}</h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mt-2 uppercase tracking-wider">
                  <Shield size={12} />
                  {currentUser?.role}
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-100 text-left">
                  <div className="flex items-center gap-3 text-sm text-[#64748b] mb-4">
                    <Mail size={16} className="text-indigo-500" />
                    <span className="truncate">{currentUser?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#64748b]">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span>Full System Access</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-8 border border-[#e2e8f0] shadow-sm">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#64748b] mb-2 uppercase tracking-wide">Display Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl py-3 pl-12 pr-4 outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#64748b] mb-2 uppercase tracking-wide">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="email" 
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl py-3 pl-12 pr-4 outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-[#64748b] mb-2 uppercase tracking-wide">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="password" 
                          name="password"
                          value={profileData.password}
                          onChange={handleProfileChange}
                          className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl py-3 pl-12 pr-4 outline-none transition-all font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#64748b] mb-2 uppercase tracking-wide">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="password" 
                          name="confirmPassword"
                          value={profileData.confirmPassword}
                          onChange={handleProfileChange}
                          className="w-full bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl py-3 pl-12 pr-4 outline-none transition-all font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex-1">
                      <AnimatePresence mode="wait">
                        {status === 'success' && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-green-600 font-bold text-sm">
                            <CheckCircle2 size={16} /> {message}
                          </motion.div>
                        )}
                        {status === 'error' && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-red-600 font-bold text-sm">
                            <AlertCircle size={16} /> {message}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <button type="submit" disabled={status === 'loading'} className="bg-[#001828] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all disabled:opacity-50">
                      <Save size={18} /> Save Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm">
               <div>
                  <h3 className="text-xl font-bold text-[#001828]">Team Directory</h3>
                  <p className="text-sm text-[#64748b]">Found {admins.length} active system members</p>
               </div>
               <button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-[#001828] to-[#6366f1] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all"
               >
                 <UserPlus size={18} />
                 Add Team Member
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {admins.map((admin) => (
                <div key={admin.id} className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-[#001828] group-hover:bg-[#001828] group-hover:text-white transition-colors">
                      <User size={24} />
                    </div>
                    {admin.id === currentUser?.id && (
                      <span className="text-[10px] bg-green-100 text-green-700 font-black px-2 py-1 rounded-md uppercase">You</span>
                    )}
                  </div>
                  <h4 className="font-bold text-[#1e293b] truncate border-b border-gray-50 pb-2 mb-3">{admin.name}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <Mail size={14} className="text-indigo-400" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span>{admin.role || 'MASTER'} ACCESS</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-[#001828]/20 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10">
              <div className="bg-[#001828] p-6 text-white text-center">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} />
                 </div>
                 <h3 className="text-xl font-bold">New Team Member</h3>
                 <p className="text-sm text-indigo-200">Grant system access to a team member</p>
              </div>
              <form onSubmit={handleAddAdmin} className="p-8 space-y-5">
                 <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2 uppercase tracking-widest">Role</label>
                    <select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 transition-all font-semibold text-sm text-[#1e293b] appearance-none"
                    >
                      <option value="MASTER">Administrator (Full Access)</option>
                      <option value="MANAGER">Manager (Counter & Management Access)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2 uppercase tracking-widest">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 transition-all font-medium"
                      placeholder="e.g. John Doe"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2 uppercase tracking-widest">Login Email</label>
                    <input 
                      required
                      type="email" 
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 transition-all font-medium"
                      placeholder="john@example.com"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-[#64748b] mb-2 uppercase tracking-widest">Initial Password</label>
                    <input 
                      required
                      type="password" 
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 transition-all font-medium"
                      placeholder="••••••••"
                    />
                 </div>
                 
                 {newAdmin.role === 'MASTER' ? (
                   <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-700">
                      <ShieldAlert size={20} className="shrink-0" />
                      <p className="text-[10px] leading-relaxed font-bold">
                         CRITICAL: This user will have full MASTER privileges. They can manage sales, tokens, and other administrators.
                      </p>
                   </div>
                 ) : (
                   <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex gap-3 text-indigo-700">
                      <ShieldCheck size={20} className="shrink-0" />
                      <p className="text-[10px] leading-relaxed font-bold">
                         INFO: This user will have MANAGER privileges. They will have access to the Counter Dashboard and other management tasks.
                      </p>
                   </div>
                 )}

                 <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                    <button type="submit" disabled={status === 'loading'} className="flex-1 bg-[#001828] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50">
                       {status === 'loading' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create User <ArrowRight size={16} /></>}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
