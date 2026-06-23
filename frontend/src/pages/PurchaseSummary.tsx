import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import {
   Filter,
   ArrowRight,
   Search,
   CheckCircle2,
   AlertCircle
} from 'lucide-react';
import {
   AreaChart,
   Area,
   XAxis,
   YAxis,
   Tooltip,
   ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const PurchaseSummary = () => {
   const [activeRange, setActiveRange] = useState('Today');
   const [data, setData] = useState<any>(null);
   const [bills, setBills] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const fetchData = async () => {
         try {
            setIsLoading(true);
            // Fetch summary and bills in parallel
            const [summaryRes, billsRes] = await Promise.all([
               apiFetch('/api/purchases/summary'),
               apiFetch('/api/purchases/orders')
            ]);

            if (summaryRes.ok && billsRes.ok) {
               const summaryData = await summaryRes.json();
               const billsData = await billsRes.json();
               setData(summaryData);
               setBills(billsData);
            }
         } catch (error) {
            console.error('Error fetching purchase summary:', error);
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
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="text-[#003317] font-black uppercase tracking-widest text-xs"
            >
               Compiling Fiscal Intelligence...
            </motion.div>
         </div>
      );
   }

   const summaryStats = [
      { title: "Total Purchases", value: `₹${(data?.totalAmount ?? 0).toLocaleString()}`, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
      { title: "Total Credits", value: `₹${(data?.balanceAmount ?? 0).toLocaleString()}`, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
      { title: "Credit Paid", value: `₹${(data?.paidAmount ?? 0).toLocaleString()}`, icon: AlertCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
      { title: "Balance Credit", value: `₹${(data?.balanceAmount ?? 0).toLocaleString()}`, icon: AlertCircle, color: "text-indigo-500", bg: "bg-indigo-50" },
      { title: "Bills to Pay", value: (data?.unpaidCount ?? 0).toString(), icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-50" }
   ];

   return (
      <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen font-inter">
         {/* Top Header */}
         <div className="flex items-center justify-between">
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                  <button title="Back" className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                     <ArrowRight className="rotate-180 text-slate-400" size={18} />
                  </button>
                  <h2 className="text-xs font-black text-[#003317] uppercase tracking-widest">Purchases</h2>
               </div>
               <h1 className="text-2xl font-black text-slate-800">Summary</h1>
            </div>

            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
               {['Yesterday', 'Today', 'Week', '30 Days'].map(range => (
                  <button
                     key={range}
                     onClick={() => setActiveRange(range)}
                     className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeRange === range ? 'text-white bg-[#003317] shadow-md shadow-[#003317]/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                     {range}
                  </button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-5 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  {summaryStats.map((stat, idx) => (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm transition-all"
                     >
                        <div className="flex items-center gap-3 mb-4">
                           <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                              <stat.icon size={20} />
                           </div>
                           <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.title}</h3>
                        </div>
                        <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                     </motion.div>
                  ))}

                  <div className="col-span-2 bg-[#003317] p-6 rounded-[32px] shadow-lg shadow-[#003317]/20 text-white relative overflow-hidden group">
                     <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                     <div className="relative z-10 flex items-end justify-between">
                        <div>
                           <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 text-white/70 mb-8">Bill Fulfillment</h3>
                           <p className="text-4xl font-black mb-1">{bills.filter(b => b.status === 'PAID').length}</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Cleared Bills</p>
                        </div>
                        <div className="text-right">
                           <CheckCircle2 size={32} className="text-emerald-400 mb-6 ml-auto" />
                           <p className="text-lg font-black text-emerald-400">
                              {bills.length > 0 ? Math.round((bills.filter(b => b.status === 'PAID').length / bills.length) * 100) : 0}%
                           </p>
                           <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Success Rate</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="col-span-12 lg:col-span-7 space-y-8">
               <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">Purchase Trends</h3>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#f43f5e]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procurement Volume</span>
                     </div>
                  </div>
                  <div className="h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.trend}>
                           <defs>
                              <linearGradient id="purchaseGradSum" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                 <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                              </linearGradient>
                           </defs>
                           <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                           <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                           <Area type="monotone" dataKey="amount" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#purchaseGradSum)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 pb-12">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">Recent Activity</h3>
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input type="text" title="Search" placeholder="Filter bills..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#003317] transition-all" />
                  </div>
                  <button title="Filter" className="p-2.5 bg-slate-50 rounded-xl text-slate-500 border border-slate-100"><Filter size={16} /></button>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill No</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {bills.map((bill: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-all cursor-pointer group">
                           <td className="px-6 py-5 text-xs font-black text-slate-800">{bill.purchaseId}</td>
                           <td className="px-6 py-5 text-xs font-bold text-slate-400">{bill.date}</td>
                           <td className="px-6 py-5">
                              <span className="text-xs font-black text-slate-700">{bill.vendor?.name || 'Walk-in'}</span>
                           </td>
                           <td className="px-6 py-5">
                              <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${bill.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {bill.status}
                              </span>
                           </td>
                           <td className="px-6 py-5 text-right text-xs font-black text-rose-500">₹{(bill.balance ?? 0).toLocaleString()}</td>
                           <td className="px-6 py-5 text-right text-xs font-black text-[#003317]">₹{(bill.amount ?? 0).toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

export default PurchaseSummary;
