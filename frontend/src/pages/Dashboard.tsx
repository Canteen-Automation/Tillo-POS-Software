import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   Target,
   ChevronRight,
   ShoppingBag,
   ArrowRight,
   Wallet,
   BarChart3,
   MessageSquare,
   Flame,
   TrendingUp
} from 'lucide-react';
import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   PieChart,
   Pie,
   Cell
} from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState('Sales');
   const [timeRange, setTimeRange] = useState('Today');
   const [customDates, setCustomDates] = useState({ from: '', to: '' });
   const [data, setData] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(true);

   const toLocalISOString = (date: Date) => {
      const tzo = -date.getTimezoneOffset(),
         dif = tzo >= 0 ? '+' : '-',
         pad = (num: number) => {
            const norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
         };
      return date.getFullYear() +
         '-' + pad(date.getMonth() + 1) +
         '-' + pad(date.getDate()) +
         'T' + pad(date.getHours()) +
         ':' + pad(date.getMinutes()) +
         ':' + pad(date.getSeconds()) +
         '.' + pad(date.getMilliseconds());
   };

   const getRangeDates = (range: string) => {
      const now = new Date();
      const start = new Date();
      const end = new Date();

      // Set end to end of today
      end.setHours(23, 59, 59, 999);

      switch (range) {
         case 'Today':
            start.setHours(0, 0, 0, 0);
            break;
         case 'Yesterday':
            start.setDate(now.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(now.getDate() - 1);
            end.setHours(23, 59, 59, 999);
            break;
         case 'Week':
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            break;
         case '30 Days':
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            break;
         case 'Custom':
            if (customDates.from && customDates.to) {
               const from = new Date(customDates.from);
               from.setHours(0, 0, 0, 0);
               const to = new Date(customDates.to);
               to.setHours(23, 59, 59, 999);
               return { from: toLocalISOString(from), to: toLocalISOString(to) };
            }
            return null;
         default:
            start.setHours(0, 0, 0, 0);
      }
      return { from: toLocalISOString(start), to: toLocalISOString(end) };
   };

   useEffect(() => {
      const fetchData = async () => {
         try {
            setIsLoading(true);
            const range = getRangeDates(timeRange);
            let url = '/api/dashboard/stats';

            if (range) {
               const params = new URLSearchParams();
               params.append('from', range.from);
               params.append('to', range.to);
               url += `?${params.toString()}`;
            }

            console.log('[DASHBOARD-TRACE] Fetching stats from:', url);
            const response = await apiFetch(url);
            if (response.ok) {
               const result = await response.json();
               setData(result);
            }
         } catch (error) {
            console.error('Error fetching dashboard data:', error);
         } finally {
            setIsLoading(false);
         }
      };
      fetchData();
   }, [timeRange, customDates]);

   if (isLoading || !data) {
      return (
         <div className="h-screen flex items-center justify-center bg-slate-50/50">
            <motion.div
               animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className="text-[#003317] font-black uppercase tracking-widest text-sm"
            >
               Loading Business Intelligence...
            </motion.div>
         </div>
      );
   }

   const { stats, storeOverview, hourlySales, insights, trendingItems } = data;

   const pieData = [
      { name: 'Full Payment', value: stats.periodRevenue, color: '#8b5cf6' },
      { name: 'Credit', value: 0, color: '#fbbf24' }
   ];

   return (
      <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen font-inter">
         {/* Top Header */}
         <div className="flex items-center justify-between">
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                  <button title="Navigate back to previous section" className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                     <ArrowRight className="rotate-180 text-slate-400" size={18} />
                  </button>
                  <h2 className="text-xs font-black text-[#003317] uppercase tracking-widest">Dashboard</h2>
               </div>
               <h1 className="text-2xl font-black text-slate-800">
                  Good morning, {(() => {
                     const saved = localStorage.getItem('systemUser');
                     return saved ? JSON.parse(saved).name : 'Partner';
                  })()}
               </h1>
               <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="p-0.5 bg-slate-200 rounded text-slate-500">i</span>
                  The default time settings for the merchant view are from 12:00 AM to 11:59 PM.
               </p>
            </div>

            <div className="flex items-center gap-3">
               <button
                  onClick={() => navigate('/feedback')}
                  className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-95"
               >
                  <MessageSquare size={16} />
                  Customer Feedback
               </button>

               <button
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
               >
                  <BarChart3 size={16} />
                  View Full Report
               </button>

            </div>
         </div>

         {/* Main Stats Grid */}
         <div className="grid grid-cols-12 gap-6">
            {/* Sales Chart Section */}
            <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="flex items-center gap-8 mb-8 border-b border-slate-50">
                  {['Sales', 'Payments'].map(tab => (
                     <button
                        key={tab}
                        title={`View ${tab} analysis and trends`}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-[#003317]' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        {tab}
                        {activeTab === tab && (
                           <motion.div layoutId="tabLineMain" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003317]" />
                        )}
                     </button>
                  ))}
               </div>

               <div className="flex items-center justify-end mb-4 gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full border-2 border-[#003317]/30 bg-[#003317]/10" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{timeRange}'s Revenue</span>
                  </div>
               </div>

               <div className="h-[280px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={hourlySales}>
                        <defs>
                           <linearGradient id="colorSalesMain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => v >= 1000 ? `🅡${v / 1000}k` : `🅡${v}`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesMain)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Total Sales Gauge */}
            <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">Total Revenue</h3>
                     <Target size={14} className="text-slate-300" />
                  </div>
               </div>

               <div className="relative h-[280px] flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={75}
                           outerRadius={100}
                           paddingAngle={0}
                           dataKey="value"
                           startAngle={210}
                           endAngle={-30}
                        >
                           {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                     <h2 className="text-3xl font-black text-slate-800 tracking-tighter">🅡{(stats.periodRevenue || 0).toLocaleString()}</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{timeRange === 'Today' ? 'Today' : timeRange}</p>
                     <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Total: 🅡{(stats.totalSales || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-6 mt-2">
                     {pieData.map(item => (
                        <div key={item.name} className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-black">{item.name}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Stats Column */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
               {/* Filters */}
               <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2 scrollbar-none">
                     {['Yesterday', 'Today', 'Week', '30 Days', 'Custom'].map(range => (
                        <button
                           key={range}
                           title={`Analyze data from ${range.toLowerCase()}`}
                           onClick={() => setTimeRange(range)}
                           className={`whitespace-nowrap px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${timeRange === range ? 'text-white bg-[#003317] shadow-md shadow-[#003317]/20' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           {range}
                        </button>
                     ))}
                  </div>
                  {timeRange === 'Custom' && (
                     <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                        <input
                           type="date"
                           value={customDates.from}
                           onChange={(e) => setCustomDates({ ...customDates, from: e.target.value })}
                           className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none focus:border-[#003317]"
                        />
                        <span className="text-slate-300 text-[10px] font-bold">to</span>
                        <input
                           type="date"
                           value={customDates.to}
                           onChange={(e) => setCustomDates({ ...customDates, to: e.target.value })}
                           className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none focus:border-[#003317]"
                        />
                     </div>
                  )}
               </div>

               {/* Total Orders Card */}
               <div title="View detailed order volume and throughput" className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative h-[180px] flex flex-col justify-between group hover:border-[#003317]/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                        <ShoppingBag size={20} />
                     </div>
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Orders</h4>
                  </div>
                  <div className="flex flex-col items-center">
                     <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{stats.activeOrders}</h2>
                     <div className="w-full h-1 bg-green-500 rounded-full mt-4 shadow-sm" />
                  </div>
               </div>

               {/* Expenses Card */}
               <div title="Track operational expenditures and overhead" className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-[130px] flex flex-col justify-between group hover:border-[#003317]/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-50 text-[#003317] rounded-xl shadow-sm group-hover:bg-[#003317]/10 transition-colors">
                        <Wallet size={20} />
                     </div>
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Expenses</h4>
                  </div>
                  <div className="text-center pb-2">
                     <h2 className="text-3xl font-black text-slate-800 tracking-tighter">₹{stats.periodExpenses.toLocaleString()}</h2>
                  </div>
               </div>
            </div>
         </div>

         {/* Trending Items Section */}
         <section>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                     <Flame size={20} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-[0.1em]">Best Selling Food</h3>
               </div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Performance Index <TrendingUp size={12} className="text-emerald-500" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {trendingItems.map((item: any, idx: number) => (
                  <motion.div
                     key={idx}
                     whileHover={{ y: -5 }}
                     className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-500/20 transition-all group overflow-hidden relative cursor-default"
                  >
                     <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-900 border border-slate-100 z-10 shadow-sm">
                        TOP #{idx + 1}
                     </div>
                     <div className="w-full h-32 rounded-2xl mb-5 overflow-hidden bg-slate-50 flex items-center justify-center">
                        {item.imageUrl ? (
                           <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                           />
                        ) : (
                           <div className="w-full h-full bg-slate-50/50" />
                        )}
                     </div>
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h4 className="text-sm font-black text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-tight">Orders Count</div>
                        <div className="text-lg font-black text-indigo-900 tracking-tighter">{item.orderCount} <span className="text-[10px] font-bold text-slate-300">Unit(s)</span></div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </section>

         {/* Bottom Section */}
         <div className="grid grid-cols-12 gap-8 mt-4 pb-12">
            {/* Store Insights */}
            <div className="col-span-12 lg:col-span-5 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col">
               <h3 className="text-sm font-black text-slate-800 tracking-tight mb-8 uppercase tracking-widest">Business Intelligence</h3>
               <div className="space-y-4 flex-1">
                  {insights.map((insight: any, idx: number) => (
                     <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all cursor-default ${insight.color || 'border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-transparent'}`}
                     >
                        <p className="text-[11px] font-black text-slate-600 leading-relaxed uppercase tracking-tight">
                           {(insight.text || insight).replace(/R(?=[0-9])/g, '🅡')}
                        </p>
                     </motion.div>
                  ))}
               </div>
               <div className="mt-8">
                  <button title="Refresh and sync comprehensive business insights" className="w-full py-3 border border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-[#003317]/30 hover:text-[#003317] transition-all">
                     Generate More Insights
                  </button>
               </div>
            </div>

            {/* Store Overview */}
            <div className="col-span-12 lg:col-span-7 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">Store Performance</h3>
                  <button title="View detailed metrics for all geographic locations" className="text-[10px] font-black text-[#003317] uppercase tracking-widest hover:underline">View All Locations</button>
               </div>

               <div className="space-y-6">
                  {(storeOverview.length > 0 ? storeOverview : [{ name: 'No active sales currently', sale: 0, orders: 0, taxes: 0, purchase: 0 }]).map((store: any, idx: number) => (
                     <div key={idx} className="p-6 rounded-[28px] border border-slate-50 bg-slate-50/30 group hover:bg-white hover:shadow-lg hover:border-transparent transition-all border-l-4 border-l-[#003317]/30">
                        <p className="text-xs font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center justify-between">
                           {store.name}
                           <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#003317]" />
                        </p>
                        <div className="grid grid-cols-4 gap-4">
                           <div className="space-y-1.5">
                              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest opacity-60">Gross Sale</p>
                              <p className="text-lg font-black text-slate-800 tracking-tighter">🅡{Number(store.sale).toLocaleString()}</p>
                           </div>
                           <div className="space-y-1.5">
                              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest opacity-60">Volume</p>
                              <p className="text-lg font-black text-slate-800 tracking-tighter">{store.orders} Orders</p>
                           </div>
                           <div className="space-y-1.5">
                              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest opacity-60">Taxation</p>
                              <p className="text-lg font-black text-slate-800 tracking-tighter">₹{store.taxes}</p>
                           </div>
                           <div className="space-y-1.5 text-right">
                              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest opacity-60">Procurement</p>
                              <p className="text-lg font-black text-slate-800 tracking-tighter">₹{store.purchase}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="mt-10 flex justify-center">
                  <button title="Execute a granular comparison across different store cohorts" className="flex items-center gap-3 px-8 py-3 bg-[#003317] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#003317]/20 hover:scale-105 transition-all group">
                     Detailed Comparison
                     <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Dashboard;
