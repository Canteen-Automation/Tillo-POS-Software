import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Shield, 
  Mail, 
  Lock, 
  Check, 
  X,
  LayoutGrid,
  Receipt,
  Users,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  BarChart3,
  Table2,
  CreditCard,
  Megaphone,
  MessageSquare,
  Store
} from 'lucide-react';

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  sections: string[];
  status: 'active' | 'inactive';
}

const ALL_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'sale', label: 'Sale', icon: Receipt },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
  { id: 'inventory', label: 'Inventory', icon: ShoppingCart },
  { id: 'expense', label: 'Expense', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'table', label: 'Table Management', icon: Table2 },
  { id: 'wallet', label: 'Wallet', icon: CreditCard },
  { id: 'promotions', label: 'Promotions', icon: Megaphone },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'stores', label: 'Stores', icon: Store }
];

const Managers = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    viewOnly: false,
    selectedSections: [] as string[]
  });

  // Fetch from Backend
  const fetchManagers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/system/managers');
      if (res.ok) {
        const data = await res.json();
        // Backend uses 'permissions' field, map it to 'sections' for the component if needed
        const mappedData = data.map((m: any) => ({
          ...m,
          sections: m.permissions || []
        }));
        setManagers(mappedData);
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const toggleSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSections: prev.selectedSections.includes(sectionId)
        ? prev.selectedSections.filter(id => id !== sectionId)
        : [...prev.selectedSections, sectionId]
    }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/system/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          viewOnly: formData.viewOnly,
          permissions: formData.selectedSections
        })
      });

      if (response.ok) {
        fetchManagers();
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', viewOnly: false, selectedSections: [] });
      } else {
        alert('Failed to create manager');
      }
    } catch (err) {
      console.error('Create manager error:', err);
      alert('Network error - make sure backend is running');
    }
  };

  const dismissManager = async (id: string) => {
    if (window.confirm('Are you sure you want to dismiss this manager?')) {
      try {
        const response = await apiFetch(`/api/system/managers/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchManagers();
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen font-inter">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#001828]">Managers</h1>
          <p className="text-[#64748b] text-sm mt-1">Manage portal access and role assignments</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#001828] text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-[#001828]/20 hover:scale-105 transition-all"
        >
          <UserPlus size={20} />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative group flex items-center">
          <div className="absolute left-5 flex items-center justify-center pointer-events-none">
            <Search className="text-[#94a3b8] group-focus-within:text-[#001828] transition-colors" size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-white border border-[#e2e8f0] rounded-2xl pl-14 pr-4 text-sm font-semibold outline-none transition-all focus:border-[#001828]/30 focus:shadow-md shadow-sm text-[#1e293b] placeholder:text-[#94a3b8]"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Active Managers</p>
            <h3 className="text-2xl font-black text-[#001828]">{managers.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Shield size={24} />
          </div>
        </div>
      </div>

      {/* Managers List */}
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-[#e2e8f0]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Manager</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Permissions</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {managers.filter(m => {
              const query = (searchQuery || '').toLowerCase();
              return (m.name || '').toLowerCase().includes(query) || 
                     (m.email || '').toLowerCase().includes(query);
            }).map((manager) => (
              <tr key={manager.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#001828] text-white flex items-center justify-center font-bold">
                      {manager.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1e293b]">{manager.name}</p>
                      <p className="text-xs font-medium text-[#94a3b8]">{manager.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                    {manager.role}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {manager.sections.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-gray-100 text-[#64748b] text-[9px] font-bold uppercase">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button 
                    onClick={() => dismissManager(manager.id)}
                    className="p-2 text-[#94a3b8] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Account Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#1e293b]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-[#1e293b]">Create manager account for <span className="text-[#001828]">Tillo Canteen</span></h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#94a3b8]">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">Name / Terminal Name</label>
                      <div className="relative group">
                        <input 
                          required
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. Main Desk"
                          className="w-full bg-white border-2 border-[#e2e8f0] focus:border-[#001828] rounded-2xl py-3 pl-4 pr-4 text-sm font-semibold outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">Email Address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8]">
                          <Mail size={16} />
                        </div>
                        <input 
                          required
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="manager@tillo.com"
                          className="w-full bg-white border-2 border-[#e2e8f0] focus:border-[#001828] rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">Password (Optional)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8]">
                        <Lock size={16} />
                      </div>
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-white border-2 border-[#e2e8f0] focus:border-[#001828] rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <div 
                      onClick={() => setFormData({...formData, viewOnly: !formData.viewOnly})}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                        formData.viewOnly ? "bg-[#001828] border-[#001828]" : "border-[#e2e8f0]"
                      )}
                    >
                      {formData.viewOnly && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-bold text-[#64748b]">View only access</span>
                  </div>

                  {/* Sections Selection */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">Accessible Sections</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {ALL_SECTIONS.map((section) => (
                        <div 
                          key={section.id}
                          onClick={() => toggleSection(section.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all gap-2",
                            formData.selectedSections.includes(section.id) 
                              ? "bg-[#001828]/5 border-[#001828] text-[#001828]" 
                              : "bg-white border-[#e2e8f0] text-[#94a3b8] hover:border-[#001828]/30"
                          )}
                        >
                          <section.icon size={20} />
                          <span className="text-[9px] font-black uppercase text-center">{section.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-[#001828] text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for class names
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Managers;
