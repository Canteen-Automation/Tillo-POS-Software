import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Wallet,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: number;
  name: string;
  mobileNumber: string;
  ritzTokenBalance: number;
}

const ManageWallets = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/wallet/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);
    setStatus(null);

    try {
      const response = await apiFetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: parseFloat(amount)
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus({ type: 'success', message: `Successfully added ${amount} Ritz to ${selectedUser.name}'s wallet` });
        fetchUsers(); // Refresh list
        setAmount('');
        setTimeout(() => {
          setIsModalOpen(false);
          setStatus(null);
        }, 2000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to credit tokens' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Connection error. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    user.mobileNumber.includes(searchQuery)
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xs font-black text-[#003317] uppercase tracking-widest">Ritz Section</h2>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Manage Wallets</h1>
          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-1">
            <span className="p-0.5 bg-slate-200 rounded text-slate-500">i</span>
            Admin panel for manual Ritz Token crediting and balance monitoring.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search user or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-[#003317] transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User ID</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Details</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Wallet Balance</th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-[10px] font-black text-[#003317] uppercase tracking-widest"
                    >
                      Loading Wallet Data...
                    </motion.div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 text-sm font-medium">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 text-sm font-black text-slate-400 tabular-nums">#{user.id}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#003317]/5 flex items-center justify-center text-[#003317]">
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-none mb-1">{user.name || 'Anonymous User'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Member</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                        <Phone size={14} className="text-slate-300" />
                        {user.mobileNumber}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl">
                        <Wallet size={14} className="text-emerald-500" />
                        <span className="text-lg font-black text-emerald-600 tracking-tighter">R{user.ritzTokenBalance.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                        className="bg-[#003317] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#003317]/10 active:scale-95"
                      >
                        Credit Wallet
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-[450px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#003317]/10 text-[#003317] rounded-xl">
                      <Plus size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800">Credit Ritz Tokens</h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100">
                  <div className="flex items-center gap-3 mb-1">
                    <UserIcon size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target User</span>
                  </div>
                  <p className="text-sm font-black text-slate-800">{selectedUser.name}</p>
                  <p className="text-xs font-bold text-slate-500">{selectedUser.mobileNumber}</p>
                </div>

                <form onSubmit={handleTopUp} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Token Amount (Ritz)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#003317] text-lg">R</div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-2xl font-black text-slate-800 outline-none focus:bg-white focus:border-[#003317]/30 transition-all"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {status && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                    >
                      {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span className="text-xs font-black uppercase tracking-tight leading-tight">{status.message}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing || !amount}
                    className="w-full bg-[#003317] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#003317]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirm Credit
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageWallets;
