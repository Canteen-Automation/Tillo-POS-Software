import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import {
   Ticket,
   Plus,
   Trash2,
   Power,
   Calendar,
   Users,
   Clock,
   ChevronRight,
   TrendingUp,
   Tag,
   AlertCircle,
   X,
   Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface Coupon {
   id: number;
   code: string;
   rewardAmount: number;
   expiryDate: string;
   maxClaims: number;
   currentClaims: number;
   isActive: boolean;
   description: string;
   createdAt: string;
}

const ManageCoupons = () => {
   const [coupons, setCoupons] = useState<Coupon[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newCoupon, setNewCoupon] = useState({
      code: '',
      rewardAmount: '',
      expiryDate: '',
      maxClaims: '',
      description: ''
   });

   const fetchCoupons = async () => {
      try {
         setIsLoading(true);
         const response = await apiFetch('/api/coupons');
         if (response.ok) {
            const data = await response.json();
            setCoupons(data);
         }
      } catch (error) {
         console.error('Error fetching coupons:', error);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchCoupons();
   }, []);

   const handleCreateCoupon = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const response = await apiFetch('/api/coupons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               ...newCoupon,
               rewardAmount: Number(newCoupon.rewardAmount),
               maxClaims: Number(newCoupon.maxClaims),
               expiryDate: new Date(newCoupon.expiryDate).toISOString()
            })
         });
         if (response.ok) {
            setIsModalOpen(false);
            setNewCoupon({ code: '', rewardAmount: '', expiryDate: '', maxClaims: '', description: '' });
            fetchCoupons();
         }
      } catch (error) {
         console.error('Error creating coupon:', error);
      }
   };

   const handleToggleStatus = async (id: number) => {
      try {
         const response = await apiFetch(`/api/coupons/${id}/toggle`, { method: 'PATCH' });
         if (response.ok) fetchCoupons();
      } catch (error) {
         console.error('Error toggling status:', error);
      }
   };

   const handleDelete = async (id: number) => {
      if (!window.confirm('Are you sure you want to delete this coupon?')) return;
      try {
         const response = await apiFetch(`/api/coupons/${id}`, { method: 'DELETE' });
         if (response.ok) fetchCoupons();
      } catch (error) {
         console.error('Error deleting coupon:', error);
      }
   };

   if (isLoading) {
      return (
         <div className="h-screen flex items-center justify-center bg-slate-50/50">
            <motion.div
               animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className="text-[#003317] font-black uppercase tracking-widest text-sm flex flex-col items-center gap-4"
            >
               <Ticket size={32} className="animate-pulse" />
               Synchronizing Coupon Network...
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
                  <h2 className="text-xs font-black text-[#003317] uppercase tracking-widest">Ritz Rewards</h2>
               </div>
               <h1 className="text-2xl font-black text-slate-800">Coupon Codes</h1>
               <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                  Manage redemption codes and promotional credits for Ritz tokens
               </p>
            </div>

            <button
               onClick={() => setIsModalOpen(true)}
               className="flex items-center gap-2 bg-[#003317] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#003317]/20 active:scale-95"
            >
               <Plus size={18} />
               Generate New Code
            </button>
         </div>

         {/* Analytics Summary */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-[#003317]/30 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-[#003317] rounded-xl">
                     <Tag size={20} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Pool</span>
               </div>
               <h3 className="text-slate-400 text-xs font-black uppercase tracking-wider">Active Coupons</h3>
               <p className="text-3xl font-black text-slate-800 mt-1">{coupons.filter(c => c.isActive).length}</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-emerald-500/30 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                     <TrendingUp size={20} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Reach</span>
               </div>
               <h3 className="text-slate-400 text-xs font-black uppercase tracking-wider">Total Redemptions</h3>
               <p className="text-3xl font-black text-slate-800 mt-1">{coupons.reduce((acc, current) => acc + current.currentClaims, 0)}</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-amber-500/30 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                     <Clock size={20} />
                  </div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Expiring Soon</span>
               </div>
               <h3 className="text-slate-400 text-xs font-black uppercase tracking-wider">Limited Availability</h3>
               <p className="text-3xl font-black text-slate-800 mt-1">
                  {coupons.filter(c => new Date(c.expiryDate).getTime() < new Date().getTime() + 86400000 * 3 && c.isActive).length}
               </p>
            </div>
         </div>

         {/* Coupons Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
               {coupons.map((coupon) => (
                  <motion.div
                     layout
                     key={coupon.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className={`bg-white rounded-[2.5rem] p-6 border-2 transition-all relative overflow-hidden group ${coupon.isActive ? 'border-slate-100' : 'border-slate-200 grayscale opacity-75 bg-slate-50'}`}
                  >
                     {/* Status Indicator */}
                     <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${coupon.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                        {coupon.isActive ? 'Operational' : 'Deactivated'}
                     </div>

                     <div className="flex gap-6">
                        <div className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed ${coupon.isActive ? 'bg-indigo-50/50 border-[#003317]/20' : 'bg-slate-100 border-slate-300'}`}>
                           <Ticket size={24} className={coupon.isActive ? 'text-[#003317]' : 'text-slate-400'} />
                           <span className={`text-[10px] font-black mt-2 uppercase tracking-tight ${coupon.isActive ? 'text-[#003317]' : 'text-slate-500'}`}>Redeem</span>
                        </div>

                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{coupon.code}</h3>
                              {!coupon.isActive && <AlertCircle size={14} className="text-slate-400" />}
                           </div>
                           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">{coupon.description || 'Global Promotional Credit'}</p>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2.5">
                                 <div className="p-1.5 bg-slate-50 rounded-lg"><Target size={14} className="text-slate-400" /></div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-0.5">Reward</p>
                                    <p className="text-sm font-black text-slate-700 leading-none">R{coupon.rewardAmount}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                 <div className="p-1.5 bg-slate-50 rounded-lg"><Calendar size={14} className="text-slate-400" /></div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-0.5">Expires</p>
                                    <p className="text-sm font-black text-slate-700 leading-none">{format(new Date(coupon.expiryDate), 'dd MMM yyyy')}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Usage Meter */}
                     <div className="mt-8 pt-6 border-t border-slate-50">
                        <div className="flex justify-between items-center mb-2">
                           <div className="flex items-center gap-1.5">
                              <Users size={14} className="text-slate-400" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Dynamics</span>
                           </div>
                           <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{coupon.currentClaims} / {coupon.maxClaims} Clm.</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                           <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(coupon.currentClaims / coupon.maxClaims) * 100}%` }}
                              className={`h-full rounded-full ${coupon.isActive ? 'bg-[#003317]' : 'bg-slate-400'}`}
                           />
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                           onClick={() => handleToggleStatus(coupon.id)}
                           title={coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                           className={`p-2 rounded-xl transition-all ${coupon.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                        >
                           <Power size={16} />
                        </button>
                        <button
                           onClick={() => handleDelete(coupon.id)}
                           title="Permanently Delete"
                           className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>

         {/* Creation Modal */}
         <AnimatePresence>
            {isModalOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setIsModalOpen(false)}
                     className="absolute inset-0 bg-[#003317]/40 backdrop-blur-md"
                  />

                  <motion.div
                     initial={{ scale: 0.9, opacity: 0, y: 20 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.9, opacity: 0, y: 20 }}
                     className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative z-10 border border-white/20"
                  >
                     <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-50 text-[#003317] rounded-xl">
                              <Ticket size={24} />
                           </div>
                           <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Generate Code</h2>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                           <X size={20} className="text-slate-400" />
                        </button>
                     </div>

                     <form onSubmit={handleCreateCoupon} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Code</label>
                              <input
                                 required
                                 type="text"
                                 placeholder="e.g. WELCOME50"
                                 value={newCoupon.code}
                                 onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#003317] transition-all"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reward Tokens</label>
                              <input
                                 required
                                 type="number"
                                 placeholder="Amount"
                                 value={newCoupon.rewardAmount}
                                 onChange={(e) => setNewCoupon({ ...newCoupon, rewardAmount: e.target.value })}
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#003317] transition-all"
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Calendar</label>
                              <input
                                 required
                                 type="date"
                                 value={newCoupon.expiryDate}
                                 onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#003317] transition-all"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quota (Max Claims)</label>
                              <input
                                 required
                                 type="number"
                                 placeholder="Inventory Limit"
                                 value={newCoupon.maxClaims}
                                 onChange={(e) => setNewCoupon({ ...newCoupon, maxClaims: e.target.value })}
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#003317] transition-all"
                              />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Description</label>
                           <textarea
                              placeholder="What is this code for?"
                              rows={3}
                              value={newCoupon.description}
                              onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#003317] transition-all resize-none"
                           />
                        </div>

                        <button
                           type="submit"
                           className="w-full bg-[#003317] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#003317]/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-3"
                        >
                           Confirm Generation
                           <ChevronRight size={18} />
                        </button>
                     </form>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default ManageCoupons;
