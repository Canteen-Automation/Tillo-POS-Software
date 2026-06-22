import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Mail, 
  Lock, 
  Check, 
  X,
  Contact
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string; // Used as username
  role: string;
  permissions: string[];
  viewOnly: boolean;
}

const Staff = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '', // Username
    password: '',
    viewOnly: false
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/system/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/system/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          viewOnly: formData.viewOnly,
          permissions: [] // Staff will use a different portal, no internal permissions needed
        })
      });

      if (response.ok) {
        fetchStaff();
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', viewOnly: false });
      } else {
        alert('Failed to create staff member');
      }
    } catch (err) {
      console.error('Create staff error:', err);
      alert('Network error - make sure server is running');
    }
  };

  const deleteStaff = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        const response = await apiFetch(`/api/system/staff/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchStaff();
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const filteredStaff = staffList.filter(s => {
    const query = (searchQuery || '').toLowerCase();
    return (s.name || '').toLowerCase().includes(query) ||
           (s.email || '').toLowerCase().includes(query);
  });

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen font-inter">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#001828]">Staff Management</h1>
          <p className="text-[#64748b] text-sm mt-1">Manage your team members and their portal permissions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#001828] text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-[#001828]/20 hover:scale-105 transition-all"
        >
          <UserPlus size={20} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative group flex items-center">
          <div className="absolute left-5 flex items-center justify-center pointer-events-none text-[#94a3b8]">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search by name or username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-white border border-[#e2e8f0] rounded-2xl pl-14 pr-4 text-sm font-semibold outline-none transition-all focus:border-[#001828]/30 focus:shadow-md shadow-sm text-[#1e293b] placeholder:text-[#94a3b8]"
          />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Total Staff</p>
            <h3 className="text-2xl font-black text-[#001828]">{staffList.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Contact size={24} />
          </div>
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-[#e2e8f0]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Team Member</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Username</th>
              <th className="px-6 py-4 text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Access</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-[#94a3b8] font-bold">Loading staff data...</td></tr>
            ) : filteredStaff.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-[#94a3b8] font-bold">No staff members found matching your search</td></tr>
            ) : filteredStaff.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#001828] text-white flex items-center justify-center font-bold">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1e293b]">{staff.name}</p>
                      <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {staff.id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <p className="text-xs font-bold text-[#1e293b]">{staff.email}</p>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${staff.viewOnly ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {staff.viewOnly ? 'View Only' : 'Full Access'}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button 
                    onClick={() => deleteStaff(staff.id)}
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

      {/* Add Staff Modal */}
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
              <div className="p-8 md:p-10 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-[#1e293b]">Add New <span className="text-[#001828]">Staff Member</span></h2>
                    <p className="text-xs font-bold text-gray-400 mt-1">Configure account details and portal access</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#94a3b8]">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="John Doe"
                        className="w-full bg-white border-2 border-[#e2e8f0] focus:border-[#001828] rounded-2xl py-3 px-4 text-sm font-semibold outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">Username (Email)</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8]">
                          <Mail size={16} />
                        </div>
                        <input 
                          required
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="staff@rit.edu"
                          className="w-full bg-white border-2 border-[#e2e8f0] focus:border-[#001828] rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94a3b8]">
                        <Lock size={16} />
                      </div>
                      <input 
                        required
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
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${formData.viewOnly ? "bg-[#001828] border-[#001828]" : "border-[#e2e8f0]"}`}
                    >
                      {formData.viewOnly && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-bold text-[#64748b]">View only access</span>
                  </div>

                  <div className="pt-4 pb-2">
                    <button 
                      type="submit"
                      className="w-full bg-[#001828] text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-[#001828]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Create Staff Account
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

export default Staff;
