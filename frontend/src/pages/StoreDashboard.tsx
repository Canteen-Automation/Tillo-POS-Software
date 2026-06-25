import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import {
   ChevronRight,
   ShoppingBag,
   Wallet,
   ArrowRight,
   RotateCcw,
   Star,
   UserMinus
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


const StoreDashboard = () => {
   const [activeTab, setActiveTab] = useState('Sales');
   const [timeRange, setTimeRange] = useState('Today');
   const [customDates, setCustomDates] = useState({ from: '', to: '' });
   const [stats, setStats] = useState({
      totalSales: 0,
      activeOrders: 0,
      dailyCustomers: 0,
      revenueGrowth: 0,
      suspendedUserCount: 0
   });
   const [trendingItems, setTrendingItems] = useState<any[]>([]);
   const [salesData, setSalesData] = useState<any[]>([]);
   const [insights, setInsights] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   const formatCurrency = (val: any) => {
      const num = Number(val);
      return isNaN(num) ? '0' : num.toLocaleString();
   };

   const toLocalISOString = (date: Date) => {
      const tzo = -date.getTimezoneOffset(),
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
      const fetchStats = async () => {
         try {
            setIsLoading(true);
             const range = getRangeDates(timeRange);
             if (!range) {
                setIsLoading(false);
                return;
             }
             const params = new URLSearchParams();
             params.append('from', range.from);
             params.append('to', range.to);

             const response = await apiFetch(`/api/dashboard/stats?${params.toString()}`);
            if (response.ok) {
               const data = await response.json();
               console.log('Dashboard data received successfully:', data);

               if (data.stats) {
                  setStats({
                     totalSales: data.stats.periodStoreRevenue,
                     activeOrders: data.stats.activeOrders,
                     dailyCustomers: data.stats.dailyCustomers,
                     revenueGrowth: data.stats.growth,
                     suspendedUserCount: data.stats.suspendedUserCount
                  });
               }

               if (data.storeOverview && data.storeOverview.length > 0) {
                  const ritStore = data.storeOverview.find((s: any) => s.name === 'Tillo Canteen');
                  if (ritStore) {
                     setStats(prev => ({
                        ...prev,
                        totalSales: data.stats.periodStoreRevenue,
                        activeOrders: ritStore.orders,
                        dailyCustomers: ritStore.orders * 0.9,
                     }));
                  }
               }

               if (data.trendingItems) setTrendingItems(data.trendingItems);
               if (data.hourlySales) setSalesData(data.hourlySales);
               if (data.insights) setInsights(data.insights);
            }
         } catch (error) {
            console.error('Error fetching dashboard stats:', error);
         } finally {
            setIsLoading(false);
         }
      };
      fetchStats();
   }, [timeRange, customDates]);

   const pieData = [
      { name: 'Full Payment', value: Number(stats.totalSales) || 0, color: '#8b5cf6' },
      { name: 'Credit', value: 0, color: '#fbbf24' }
   ];

   if (isLoading) {
      return (
         <div className="h-screen flex items-center justify-center bg-slate-50/50">
            <motion.div
               animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className="text-[#003317] font-black uppercase tracking-widest text-sm"
            >
               Analyzing Store Data...
            </motion.div>
         </div>
      );
   }


   return (
      <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen font-inter">
         {/* Top Header */}
         <div className="flex items-center justify-between">
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                  <button title="Return to previous screen" className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                     <ArrowRight className="rotate-180 text-slate-400" size={18} />
                  </button>
                  <h2 className="text-xs font-black text-[#003317] uppercase tracking-widest">Store Dashboard</h2>
               </div>
               <h1 className="text-2xl font-black text-slate-800">
                  Good morning, {(() => {
                     const saved = localStorage.getItem('systemUser');
                     return saved ? JSON.parse(saved).name : 'Partner';
                  })()}
               </h1>
            </div>

            <div className="flex items-center gap-3">
               {/* Action buttons or profile placeholder can go here if needed later */}
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
                        title={`Visualize ${tab.toLowerCase()} throughput data`}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-[#003317]' : 'text-slate-400 hover:text-slate-600'}`}
                     >
                        {tab}
                        {activeTab === tab && (
                           <motion.div layoutId="tabLineStore" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003317]" />
                        )}
                     </button>
                  ))}
               </div>

               <div className="h-[280px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={salesData}>
                        <defs>
                           <linearGradient id="colorSalesStore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => v >= 1000 ? `R${v / 1000}k` : `R${v}`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesStore)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Total Sales Gauge */}
            <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative">
               <div className="relative h-[280px] flex flex-col items-center justify-center mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={80}
                           outerRadius={105}
                           paddingAngle={0}
                           dataKey="value"
                           startAngle={210}
                           endAngle={-150}
                        >
                           {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                     <h2 className="text-3xl font-black text-slate-800 tracking-tighter">₹{formatCurrency(stats.totalSales)}</h2>
                  </div>
                  <div className="flex gap-6 mt-4">
                     <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full-Payment</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit</span>
                     </div>
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
                            title={`Filter metrics by ${range.toLowerCase()}`}
                            onClick={() => setTimeRange(range)}
                            className={`whitespace-nowrap px-2 py-2 text-[10px] font-black uppercase tracking-tighter transition-all relative ${timeRange === range ? 'text-[#003317]' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            {range}
                            {timeRange === range && (
                               <motion.div layoutId="rangeLineStore" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003317]" />
                            )}
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
               <div title="View detailed store volume and throughput" className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative h-[180px] flex flex-col justify-between group cursor-pointer hover:border-[#003317]/30 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                        <ShoppingBag size={20} />
                     </div>
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Sales</h4>
                  </div>
                  <div className="flex flex-col items-center">
                     <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{stats.activeOrders}</h2>
                     <div className="w-full h-1 bg-green-500 rounded-full mt-4 shadow-sm" />
                  </div>
               </div>

               {/* Restricted Accounts Card */}
               <div title="Monitor suspended customer accounts" className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-[130px] flex flex-col justify-between group cursor-pointer hover:border-red-500/30 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:scale-110 transition-transform">
                        <UserMinus size={20} />
                     </div>
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Restricted Accounts</h4>
                  </div>
                  <div className="text-center">
                     <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{stats?.suspendedUserCount || 0}</h2>
                  </div>
               </div>

               {/* Expenses Card */}
               <div title="Monitor store operational expenditures" className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-[130px] flex flex-col justify-between group cursor-pointer hover:border-[#003317]/30 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-amber-100 text-[#003317] rounded-xl shadow-sm">
                        <Wallet size={20} />
                     </div>
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Expenses</h4>
                  </div>
                  <div className="text-center">
                     <h2 className="text-4xl font-black text-slate-800 tracking-tighter">₹0</h2>
                  </div>
               </div>
            </div>
         </div>

         {/* Bottom Section */}
         <div className="grid grid-cols-12 gap-8 mt-4 pb-12">
            {/* Trending Items */}
            <div className="col-span-12 lg:col-span-6 bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">Trending Items</h3>
                     <div className="p-1 px-2 bg-indigo-50 rounded-lg text-indigo-400">
                        <Star size={12} fill="currentColor" />
                     </div>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-100">
                     <button title="View inventory metrics" className="p-1.5 text-slate-400 hover:text-slate-600 transition-all"><ShoppingBag size={14} /></button>
                     <button title="View price distributions" className="text-[10px] font-black text-slate-400 px-1">₹</button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="text-left border-b border-slate-50">
                           <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                           <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sold Quantity</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {trendingItems.map((item, idx) => (
                           <tr key={idx} className="group cursor-pointer hover:bg-slate-50/50 transition-all">
                              <td className="py-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-50 group-hover:scale-105 transition-transform flex items-center justify-center">
                                       {item.imageUrl ? (
                                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                       ) : (
                                          <div className="w-full h-full bg-slate-100" />
                                       )}
                                    </div>
                                    <div className="space-y-0.5">
                                       <p className="text-[9px] font-black text-[#003317] uppercase tracking-widest brightness-110">{item.category}</p>
                                       <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.name}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-4 text-right">
                                 <span className="text-sm font-black text-slate-800">{item.orderCount}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Store Insights */}
            <div className="col-span-12 lg:col-span-6 bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex flex-col">
               <h3 className="text-sm font-black text-slate-800 tracking-tight mb-8 uppercase tracking-widest">Store Insights</h3>

               <div className="space-y-4 flex-1 overflow-y-auto max-h-[480px] custom-scrollbar pr-2">
                  {insights.map((insight, idx) => (
                     <div key={idx} className={`p-4 rounded-2xl border transition-all hover:translate-x-1 ${insight.color} flex items-center gap-3`}>
                        <div className="w-6 h-6 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center shrink-0">
                           <Star size={12} className="opacity-70" />
                        </div>
                        <p className="text-[11px] font-bold leading-relaxed">{insight.text}</p>
                     </div>
                  ))}
               </div>

               <div className="mt-8 flex justify-end">
                  <button title="Analyze subsequent business cycles" className="flex items-center gap-2 px-6 py-2.5 bg-[#003317]/5 hover:bg-[#003317]/10 text-[#003317] text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all group">
                     Next
                     <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default StoreDashboard;
