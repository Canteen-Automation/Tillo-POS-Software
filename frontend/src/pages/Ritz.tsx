import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CircleDollarSign, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Search,
  Filter,
  Download,
  Fingerprint
} from 'lucide-react';
import { motion } from 'framer-motion';
import colorVector from '../assets/color-vector.png';

interface TokenTransaction {
  id: number;
  amount: number;
  type: 'TOPUP' | 'SPEND' | 'REFUND';
  description: string;
  timestamp: string;
  referenceId: string;
  user: {
    id: number;
    name: string;
    mobileNumber: string;
  };
}

interface Stats {
  totalCirculation: number;
  activeWallets: number;
  totalUsers: number;
  serializedUnitsTotal: number;
}

const RitzPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCirculation: 0,
    activeWallets: 0,
    totalUsers: 0,
    serializedUnitsTotal: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const host = window.location.hostname;
      
      const statsRes = await apiFetch(`http://${host}:8080/api/wallet/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const transRes = await apiFetch(`http://${host}:8080/api/wallet/transactions/all`);
      const transData = await transRes.json();
      setTransactions(Array.isArray(transData) ? transData : []);
    } catch (error) {
      console.error('Error fetching Ritz data:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(t => 
    t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user?.mobileNumber?.includes(searchTerm) ||
    t.referenceId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-inter animate-slideUp">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden bg-[#001828] rounded-3xl p-8 mb-8 text-white shadow-2xl shadow-indigo-200">
        <img 
          src={colorVector} 
          alt="Vector BG" 
          className="absolute right-0 top-0 h-full w-auto opacity-30 object-cover pointer-events-none"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <CircleDollarSign size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Ritz Ecosystem</h1>
          </div>
          <p className="text-indigo-100/80 max-w-lg font-medium">
            Monitor the heartbeat of the Ritz digital economy. Track circulation, 
            active wallets, and system-wide transactions in real-time.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {[
          { label: 'Tokens in Circulation', value: `R${(stats.totalCirculation || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Token Wallets', value: (stats.activeWallets || 0).toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Serialized Audit Units', value: (stats.serializedUnitsTotal || 0).toLocaleString(), icon: Fingerprint, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Accounts', value: (stats.totalUsers || 0).toLocaleString(), icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">{item.label}</p>
              <h3 className={`text-3xl font-black ${item.color}`}>{item.value}</h3>
            </div>
            <div className={`p-4 ${item.bg} ${item.color} rounded-2xl`}>
              <item.icon size={28} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">Master Transaction Log</h2>
            <p className="text-sm text-slate-500 font-medium">Detailed history of all wallet activities</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search user or ref..."
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:bg-white outline-none transition-all w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
              <Filter size={18} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#001828] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
              <Download size={18} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-24 flex flex-col items-center justify-center text-slate-400">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <span className="font-bold">Syncing Transaction Feed...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">Customer</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">Type</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">Amount</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">Description</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-400">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-xs">
                          {t.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{t.user.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{t.user.mobileNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                        t.type === 'TOPUP' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {t.type === 'TOPUP' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-base font-black ${t.type === 'TOPUP' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {t.type === 'TOPUP' ? '+' : '-'} R{t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{t.description}</p>
                      <p className="text-[11px] text-slate-400 font-medium font-mono">{t.referenceId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-slate-500">
                        <Clock size={14} className="opacity-60" />
                        {new Date(t.timestamp).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default RitzPage;
