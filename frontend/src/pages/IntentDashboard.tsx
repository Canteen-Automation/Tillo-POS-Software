import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
   Filter,
   ChevronRight,
   ShoppingBag,
   Package,
   Wallet,
   RefreshCw,
   Clock,
   LayoutGrid,
   FileText,
   Boxes,
   Eye,
   ArrowRight
} from 'lucide-react';
import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer
} from 'recharts';

interface IntentDashboardProps {
   title: string;
}

const StatCard = ({ icon: Icon, label, value, color }: any) => (
   <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-2xl border border-[#e2e8f0] flex items-center gap-4 flex-1 shadow-sm hover:shadow-md transition-all"
   >
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
         <Icon size={20} />
      </div>
      <div>
         <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">{label}</p>
         <h3 className="text-xl font-black text-[#1e293b]">{value}</h3>
      </div>
   </motion.div>
);

interface IntentStats {
   openCount: number;
   openItems: number;
   payableAmount: number;
   unbilledCount: number;
   recentOrders: any[];
   trend: any[];
}

const IntentDashboard: React.FC<IntentDashboardProps> = ({ title }) => {
   const [stats, setStats] = useState<IntentStats | null>(null);
   const [loading, setLoading] = useState(true);
   const [filterTab, setFilterTab] = useState('All');
   const navigate = useNavigate();

   useEffect(() => {
      fetchStats();
   }, [title]);

   const fetchStats = async () => {
      setLoading(true);
      try {
         const response = await apiFetch(`http://${window.location.hostname}:8080/api/purchases/intent/summary`);
         const data = await response.json();
         setStats(data);
      } catch (error) {
         console.error('Error fetching intent stats:', error);
      } finally {
         setLoading(false);
      }
   };

   const chartData = stats?.trend?.map(t => ({
      date: format(new Date(t[0]), 'MMM dd'),
      total: t[1],
      open: t[1] * 0.4 // Sample logic for visual variety if status-specific trend isn't available
   })) || [];

   const statusBreakdown = [
      { label: 'OPEN', value: stats?.openCount || 0 },
      { label: 'CLOSE', value: stats?.recentOrders?.filter(o => o.status === 'CLOSE').length || 0 },
      { label: 'ACKNOWLEDGE', value: 0 },
      { label: 'RECEIVED', value: stats?.unbilledCount || 0 }
   ];
   return (
      <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen font-inter">
         {/* Top Header & Filter */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-xl font-black text-[#003317] uppercase tracking-wider flex items-center gap-2">
               <LayoutGrid size={20} />
               {title}
            </h1>
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-[#e2e8f0] shadow-sm">
               <button className="flex items-center gap-2 bg-[#003317] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#1e4e8c] transition-all shadow-md shadow-[#003317]/10">
                  <Filter size={14} /> Filter
               </button>
               <div className="flex items-center gap-3 px-3 border-l border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Start:</span>
                     <span className="text-xs font-bold text-[#003317] bg-[#003317]/5 px-2.5 py-1 rounded-lg">2026-03-10</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-[#94a3b8] uppercase">End:</span>
                     <span className="text-xs font-bold text-[#003317] bg-[#003317]/5 px-2.5 py-1 rounded-lg">2026-04-10</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="flex flex-wrap gap-4 relative">
            {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center"><RefreshCw className="animate-spin text-[#003317]" size={24} /></div>}
            <StatCard icon={Clock} label="Open" value={stats?.openCount || 0} color="bg-cyan-500" />
            <StatCard icon={Boxes} label="Open Items" value={stats?.openItems || 0} color="bg-indigo-500" />
            <StatCard icon={Wallet} label="Payable Amount" value={`₹${stats?.payableAmount?.toLocaleString() || 0}`} color="bg-amber-500" />
            <StatCard icon={FileText} label="Unbilled" value={stats?.unbilledCount || 0} color="bg-rose-500" />
         </div>

         {/* Main Content Area */}
         <div className="grid grid-cols-12 gap-6">
            {/* Left Column: Chart & Breakdown */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
               <div className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-sm font-black text-[#1e293b] flex items-center gap-2">
                        Orders in the last 30 days
                        <button onClick={fetchStats} className={`text-[#94a3b8] hover:text-[#003317] transition-colors ${loading ? 'animate-spin' : ''}`}><RefreshCw size={14} /></button>
                     </h3>
                     <div className="flex items-center gap-4">
                        {['Open', 'Closed', 'Total'].map((l, i) => (
                           <div key={l} className="flex items-center gap-1.5">
                              <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-rose-500' : 'bg-[#003317]'}`} />
                              <span className="text-[10px] font-bold text-[#64748b]">{l}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                           <Tooltip
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                              itemStyle={{ fontWeight: 'bold' }}
                           />
                           <Area type="monotone" dataKey="open" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} strokeWidth={2} />
                           <Area type="monotone" dataKey="total" stroke="#003317" fill="#003317" fillOpacity={0.05} strokeWidth={2} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm">
                     <h3 className="text-sm font-black text-[#1e293b] mb-12">Top Items</h3>
                     <div className="flex flex-col items-center justify-center p-8 text-[#94a3b8]">
                        <Package size={48} className="opacity-10 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">No items found</p>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm">
                     <h3 className="text-sm font-black text-[#1e293b] mb-6">Status Breakdown</h3>
                     <div className="space-y-4">
                        {statusBreakdown.map(s => (
                           <div key={s.label} className="group border-b border-[#f1f5f9] last:border-0 pb-3 last:pb-0 flex items-center justify-between hover:bg-gray-50/50 rounded-lg p-1 transition-all cursor-pointer">
                              <span className="text-[11px] font-black text-[#64748b] tracking-wider">{s.label}</span>
                              <div className="flex items-center gap-3">
                                 <span className="text-xs font-black text-[#1e293b]">{s.value}</span>
                                 <button className="text-[#94a3b8] group-hover:text-[#003317] opacity-0 group-hover:opacity-100 transition-all"><ArrowRight size={14} /></button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Recent & Links */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
               <div className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm overflow-hidden relative">
                  {loading && <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10" />}
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-sm font-black text-[#1e293b]">Recent Orders</h3>
                     <button onClick={fetchStats} className={`text-[#38bdf8] p-1.5 hover:bg-sky-50 rounded-lg transition-all ${loading ? 'animate-spin' : ''}`}><RefreshCw size={16} /></button>
                  </div>
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                     {['All', 'Open', 'Billed', 'Received', 'Closed'].map((t) => (
                        <button
                           key={t}
                           onClick={() => setFilterTab(t)}
                           className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterTab === t ? 'bg-[#003317] text-white shadow-md shadow-[#003317]/20' : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]'}`}
                        >
                           {t}
                        </button>
                     ))}
                  </div>
                  <div className="space-y-3">
                     {(() => {
                        const filtered = stats?.recentOrders?.filter(o => {
                           if (filterTab === 'All') return true;
                           if (filterTab === 'Open') return o.status === 'OPEN';
                           if (filterTab === 'Billed') return o.status === 'BILLED';
                           if (filterTab === 'Received') return o.status === 'RECEIVED';
                           if (filterTab === 'Closed') return o.status === 'CLOSE' || o.status === 'CLOSED';
                           return true;
                        }) || [];

                        if (filtered.length === 0) {
                           return <div className="py-12 text-center text-[#94a3b8] text-xs font-bold italic">No {filterTab.toLowerCase()} orders</div>;
                        }

                        return filtered.map(o => (
                           <div key={o.id} className="p-3 bg-[#f8fafc] border border-[#f1f5f9] rounded-xl hover:shadow-md transition-all cursor-pointer group">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="text-[11px] font-black text-[#1e293b]">#{o.purchaseId || o.id}</span>
                                 <span className="text-[11px] font-black text-[#1e293b]">₹{o.amount?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                 <span className="text-[10px] font-semibold text-[#94a3b8]">{o.date ? format(new Date(o.date), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                                 <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${o.status === 'CLOSE' || o.status === 'CLOSED' ? 'text-rose-600 bg-rose-50' :
                                       o.status === 'OPEN' ? 'text-amber-600 bg-amber-50' :
                                          o.status === 'BILLED' ? 'text-indigo-600 bg-indigo-50' :
                                             'text-emerald-700 bg-emerald-100'
                                    }`}>{o.status}</span>
                              </div>
                           </div>
                        ));
                     })()}
                  </div>
               </div>

               <div className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm">
                  <h3 className="text-sm font-black text-[#1e293b] mb-4">Quick Links</h3>
                  <div className="space-y-2">
                     {[
                        { label: 'Inventory', icon: Boxes, path: '/inventory/products' },
                        { label: 'Raw Materials', icon: Package, path: '/inventory/base' },
                        { label: 'Draft Orders', icon: FileText, path: '/purchases/orders' }
                     ].map(l => (
                        <button
                           key={l.label}
                           onClick={() => navigate(l.path)}
                           className="w-full flex items-center justify-between p-3.5 bg-[#f8fafc] border border-[#f1f5f9] rounded-xl hover:bg-gray-50 transition-all group"
                        >
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm text-[#94a3b8] group-hover:text-[#003317] transition-colors">
                                 <l.icon size={16} />
                              </div>
                              <span className="text-xs font-bold text-[#64748b]">{l.label}</span>
                           </div>
                           <ChevronRight size={14} className="text-[#cbd5e1] group-hover:text-[#003317] transition-all" />
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default IntentDashboard;
