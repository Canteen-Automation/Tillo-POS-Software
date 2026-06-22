import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowUpRight,
  Package,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Removed static data

const StatCard = ({ title, value, change, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={20} />
      </div>
      <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
        <ArrowUpRight size={10} />
        {change}%
      </div>
    </div>
    <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1">{title}</p>
    <h3 className="text-xl font-black text-[#1e293b]">{value}</h3>
  </motion.div>
);

const VendorDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch('/api/dashboard/procurement');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching procurement data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50/50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[#001828] font-black uppercase tracking-widest text-sm"
        >
          Analyzing Supply Chain...
        </motion.div>
      </div>
    );
  }

  const { stats, trends, topVendors } = data;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#001828] tracking-tight">Vendor Dashboard</h1>
          <p className="text-[#64748b] text-sm font-medium">Monitoring procurement, supplier health, and order cycles.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#1e293b] hover:bg-gray-50 flex items-center gap-2">
                <Clock size={14} /> Last 30 Days
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Procurement" value={`₹${stats.totalProcurement.toLocaleString()}`} change={12} icon={DollarSign} color="bg-blue-500" delay={0.1} />
        <StatCard title="Active Vendors" value={stats.activeVendors} change={5} icon={Users} color="bg-emerald-500" delay={0.2} />
        <StatCard title="Pending POs" value={stats.pendingPOs.toString().padStart(2, '0')} change={2} icon={Package} color="bg-amber-500" delay={0.3} />
        <StatCard title="Supply Fill Rate" value={`${stats.fillRate}%`} change={1.5} icon={TrendingUp} color="bg-violet-500" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
                <BarChart3 size={18} className="text-[#001828]" />
                Purchase Trends
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#001828" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#001828" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                <Tooltip />
                <Area type="monotone" dataKey="purchases" stroke="#001828" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#001828]" />
                Orders by Volume
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                <Tooltip />
                <Bar dataKey="orders" fill="#001828" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-sm p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-[#1e293b] mb-6">Top Performing Vendors</h3>
          <div className="space-y-4">
              {topVendors.length > 0 ? (
                topVendors.map((v: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${v.color || 'bg-indigo-100 text-indigo-600'} flex items-center justify-center font-bold text-sm`}>
                                {v.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#1e293b] group-hover:text-[#001828] transition-colors">{v.name}</p>
                                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">{v.orders} Orders this month</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-[#1e293b]">₹{v.volume.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Excellent Status</p>
                        </div>
                    </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 font-medium italic">No vendor performance data available for this period.</div>
              )}
          </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
