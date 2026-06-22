import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreVertical, 
  Store, 
  Image as ImageIcon, 
  X, 
  Edit2, 
  Trash2, 
  Check,
  Loader2,
  Package,
  Layers,
  Search as SearchIcon,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface BaseItem {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

interface StallSession {
  id?: number;
  dayOfWeek: string;
  active: boolean;
  startTime: string;
  endTime: string;
}

interface Stall {
  id: number;
  name: string;
  description: string;
  imageData?: string;
  active: boolean;
  temporarilyClosed: boolean;
  sessionOptional: boolean;
  sessions: StallSession[];
  products: Product[];
  baseItems: BaseItem[];
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const getDefaultSessions = (): StallSession[] => 
  DAYS.map(day => ({ dayOfWeek: day, active: true, startTime: '00:00', endTime: '23:59' }));

const Stalls: React.FC = () => {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageData: '' as string | undefined,
    temporarilyClosed: false,
    sessionOptional: false,
    sessions: getDefaultSessions()
  });
  const [isSaving, setIsSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Item Linking State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allBaseItems, setAllBaseItems] = useState<BaseItem[]>([]);
  const [tempProductIds, setTempProductIds] = useState<number[]>([]);
  const [tempBaseItemIds, setTempBaseItemIds] = useState<number[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'baseItems'>('products');

  useEffect(() => {
    fetchStalls();
  }, []);

  const fetchStalls = async () => {
    try {
      setLoading(true);
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/stalls`);
      if (response.ok) {
        const data = await response.json();
        setStalls(data);
      }
    } catch (error) {
      console.error('Error fetching stalls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageData: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const host = window.location.hostname;
      const url = editingStall 
        ? `http://${host}:8080/api/stalls/${editingStall.id}`
        : `http://${host}:8080/api/stalls`;
      
      const response = await apiFetch(url, {
        method: editingStall ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...formData,
           active: true
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingStall(null);
        setFormData({ 
          name: '', 
          description: '', 
          imageData: '',
          temporarilyClosed: false,
          sessionOptional: false,
          sessions: getDefaultSessions()
        });
        fetchStalls();
      }
    } catch (error) {
      console.error('Error saving stall:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (stall: Stall) => {
    setOpenMenuId(null);
    setEditingStall(stall);
    setFormData({
      name: stall.name,
      description: stall.description,
      imageData: stall.imageData,
      temporarilyClosed: stall.temporarilyClosed,
      sessionOptional: stall.sessionOptional,
      sessions: stall.sessions && stall.sessions.length > 0 ? stall.sessions : getDefaultSessions()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this stall?')) return;
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/stalls/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchStalls();
      }
    } catch (error) {
      console.error('Error deleting stall:', error);
    }
  };

  const openLinkModal = async (stall: Stall) => {
    setOpenMenuId(null);
    setSelectedStall(stall);
    setTempProductIds(stall.products?.map(p => p.id) || []);
    setTempBaseItemIds(stall.baseItems?.map(b => b.id) || []);
    setIsItemModalOpen(true);
    
    try {
      const host = window.location.hostname;
      const [prodRes, baseRes] = await Promise.all([
        apiFetch(`http://${host}:8080/api/products?size=1000`),
        apiFetch(`http://${host}:8080/api/base-items?size=100`)
      ]);
      
      if (prodRes.ok) {
        const data = await prodRes.json();
        setAllProducts(data.content || data);
      }
      if (baseRes.ok) {
        const data = await baseRes.json();
        setAllBaseItems(data.content || data);
      }
    } catch (error) {
      console.error('Error fetching available items:', error);
    }
  };

  const saveItemAssociations = async () => {
    if (!selectedStall) return;
    setIsSaving(true);
    try {
      const host = window.location.hostname;
      const response = await apiFetch(`http://${host}:8080/api/stalls/${selectedStall.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: tempProductIds,
          baseItemIds: tempBaseItemIds
        })
      });
      
      if (response.ok) {
        setIsItemModalOpen(false);
        fetchStalls();
      } else {
        const errorData = await response.json();
        window.alert(`Failed to save inventory: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating stall items:', error);
      window.alert('A network error occurred while updating stall inventory.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStalls = stalls.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isStallOpen = (stall: Stall) => {
    if (stall.temporarilyClosed) return false;
    if (!stall.sessionOptional) return true;
    
    const now = new Date();
    const currentDay = DAYS[now.getDay()];
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const session = stall.sessions?.find(s => s.dayOfWeek === currentDay);
    if (!session || !session.active) return false;
    
    return currentTimeStr >= session.startTime && currentTimeStr <= session.endTime;
  };

  const updateSession = (index: number, updates: Partial<StallSession>) => {
    const newSessions = [...formData.sessions];
    newSessions[index] = { ...newSessions[index], ...updates };
    setFormData({ ...formData, sessions: newSessions });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-8 gap-8 animate-in fade-in duration-500 overflow-y-auto font-inter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px]">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#001828] rounded-xl flex items-center justify-center shadow-lg shadow-[#001828]/20">
            <Store className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Stalls Management</h1>
            <p className="text-sm text-[#64748b]">Configure and manage your independent canteen service counters</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group min-w-[320px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#001828] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search stalls..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#001828]/30 transition-all shadow-sm"
            />
          </div>
          
          <button 
            onClick={() => {
              setEditingStall(null);
              setFormData({ 
                name: '', 
                description: '', 
                imageData: '',
                temporarilyClosed: false,
                sessionOptional: false,
                sessions: getDefaultSessions()
              });
              setIsModalOpen(true);
            }}
            className="px-6 py-2.5 bg-[#001828] text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#001828]/20 hover:scale-[1.01] active:scale-95 transition-all"
          >
            <Plus size={18} /> Add Stall
          </button>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="max-w-[1600px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-[350px] animate-pulse border border-[#e2e8f0]" />
            ))}
          </div>
        ) : filteredStalls.length === 0 ? (
          <div className="bg-white rounded-xl p-24 text-center border border-[#e2e8f0] shadow-sm">
             <Store size={48} className="text-slate-200 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-800 mb-1">No stalls established</h3>
             <p className="text-slate-500 text-sm">Start by adding your first service counter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredStalls.map(stall => (
              <div 
                key={stall.id} 
                onClick={() => openLinkModal(stall)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] hover:border-[#001828]/30 transition-all hover:shadow-xl flex flex-col relative"
              >
                {/* Image Section */}
                <div className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-[#e2e8f0]">
                   {stall.imageData ? (
                     <img src={stall.imageData} alt={stall.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                   ) : (
                     <Store size={40} className="text-slate-200" />
                   )}
                   <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                      <button 
                        disabled={isModalOpen || isItemModalOpen}
                        onClick={() => setOpenMenuId(openMenuId === stall.id ? null : stall.id)}
                        className={`w-9 h-9 bg-white shadow-lg rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors border border-[#e2e8f0] ${(isModalOpen || isItemModalOpen) ? 'opacity-20 cursor-not-allowed cursor-default filter blur-md pointer-events-none' : ''}`}
                      >
                        <MoreVertical size={16} />
                      </button>
                      <AnimatePresence>
                        {openMenuId === stall.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-[#e2e8f0] z-20 overflow-hidden"
                          >
                             <button onClick={() => handleEdit(stall)} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-[#475569] hover:bg-gray-50 transition-colors border-b border-[#f1f5f9]">
                               <Edit2 size={14} className="text-indigo-500" /> Edit Details
                             </button>
                             <button onClick={() => handleDelete(stall.id)} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                               <Trash2 size={14} /> Delete
                             </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-[#1e293b] truncate">{stall.name}</h3>
                      <div className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${
                        isStallOpen(stall) 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {stall.temporarilyClosed ? 'Closed' : isStallOpen(stall) ? 'Active' : 'Offline'}
                      </div>
                   </div>
                   <p className="text-[#64748b] text-sm font-medium line-clamp-2 leading-relaxed mb-6 h-10">
                     {stall.description || 'Dedicated food service counter for our premium canteen offerings.'}
                   </p>
                   
                   <div className="mt-auto pt-4 border-t border-[#f1f5f9] flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">Products</span>
                           <span className="text-sm font-bold text-[#1e293b]">{stall.products?.length || 0}</span>
                        </div>
                        <div className="w-[1px] h-8 bg-[#f1f5f9]" />
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">Base Items</span>
                           <span className="text-sm font-bold text-[#1e293b]">{stall.baseItems?.length || 0}</span>
                        </div>
                      </div>
                      <div className="w-9 h-9 bg-gray-50 border border-[#e2e8f0] rounded-xl flex items-center justify-center text-[#001828] group-hover:border-[#001828] group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm">
                        <Plus size={16} strokeWidth={3} />
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Stall Modal - Replicated from Customer Design */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#001828]/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto"
            >
              <div className="px-10 py-8 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#001828]/5 rounded-xl flex items-center justify-center text-[#001828]">
                    <Store size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1e293b]">{editingStall ? 'Edit Stall' : 'Create New Stall'}</h2>
                    <p className="text-sm text-[#64748b]">Configure your canteen service counter details</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={24} className="text-[#64748b]" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] uppercase font-black text-[#64748b] mb-2.5 tracking-widest ml-1">Stall Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-[#e2e8f0] rounded-2xl text-base font-bold focus:ring-4 focus:ring-[#001828]/5 focus:border-[#001828] transition-all outline-none"
                      placeholder="e.g. Continental Corner"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-black text-[#64748b] mb-2.5 tracking-widest ml-1">Description</label>
                    <textarea 
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-[#e2e8f0] rounded-2xl text-base font-bold focus:ring-4 focus:ring-[#001828]/5 focus:border-[#001828] transition-all outline-none resize-none"
                      placeholder="Briefly describe the counter's specialty..."
                    />
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-[#e2e8f0] border-dashed">
                    <label className="block text-[11px] uppercase font-black text-[#64748b] mb-4 tracking-widest ml-1">Visual Branding</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-white rounded-2xl border border-[#e2e8f0] flex items-center justify-center overflow-hidden relative group shadow-sm">
                        {formData.imageData ? (
                          <>
                            <img src={formData.imageData} alt="Preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setFormData({ ...formData, imageData: '' })} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <X size={20} />
                            </button>
                          </>
                        ) : (
                          <ImageIcon size={32} className="text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input type="file" id="stall-image" hidden accept="image/*" onChange={handleImageChange} />
                        <label htmlFor="stall-image" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#e2e8f0] rounded-xl font-bold text-xs text-slate-600 hover:bg-gray-50 hover:border-slate-300 cursor-pointer shadow-sm transition-all active:scale-95">
                           <ImageIcon size={14} /> Upload Banner
                        </label>
                        <p className="mt-3 text-[10px] text-slate-400 font-medium tracking-wide">Recommended aspect ratio 4:3 (Max 2MB)</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className={`p-6 rounded-2xl border transition-all ${formData.temporarilyClosed ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-[#e2e8f0]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${formData.temporarilyClosed ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-400'}`}>
                            <AlertCircle size={18} />
                          </div>
                          <span className="text-sm font-bold text-[#1e293b]">Quick Close</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormData({ ...formData, temporarilyClosed: !formData.temporarilyClosed })}
                          className={`w-11 h-6 rounded-full relative transition-all ${formData.temporarilyClosed ? 'bg-rose-500' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.temporarilyClosed ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#64748b] font-medium leading-relaxed">Manually mark this stall as closed, overriding all schedules.</p>
                    </div>

                    <div className={`p-6 rounded-2xl border transition-all ${formData.sessionOptional ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-[#e2e8f0]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${formData.sessionOptional ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400'}`}>
                            <Clock size={18} />
                          </div>
                          <span className="text-sm font-bold text-[#1e293b]">Automated Schedule</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormData({ ...formData, sessionOptional: !formData.sessionOptional })}
                          className={`w-11 h-6 rounded-full relative transition-all ${formData.sessionOptional ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.sessionOptional ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      {formData.sessionOptional ? (
                        <button 
                          type="button" 
                          onClick={() => setShowSessionModal(true)}
                          className="mt-2 w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Calendar size={14} /> Configure Hours
                        </button>
                      ) : (
                        <p className="text-[11px] text-[#64748b] font-medium leading-relaxed">Let the counter open/close automatically based on time.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-8 py-4 border-2 border-[#e2e8f0] text-[#64748b] font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-[1.5] px-8 py-4 bg-[#001828] text-white font-bold rounded-2xl shadow-xl shadow-[#001828]/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 text-sm"
                  >
                    {isSaving ? (
                      <><Loader2 size={20} className="animate-spin" /> Saving...</>
                    ) : (
                      editingStall ? 'Update Stall' : 'Create Stall'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Item Configuration Modal - Resized but same style */}
      <AnimatePresence>
        {isItemModalOpen && selectedStall && (
          <div className="fixed inset-0 bg-[#001828]/20 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh] my-auto"
            >
              <div className="px-10 py-8 border-b border-[#e2e8f0] flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#001828]/5 rounded-xl flex items-center justify-center text-[#001828]">
                    <Package size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1e293b]">Inventory: {selectedStall.name}</h2>
                    <p className="text-sm text-[#64748b]">Configure available items and stock for this counter</p>
                  </div>
                </div>
                <button onClick={() => setIsItemModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={24} className="text-[#64748b]" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col p-10 gap-8">
                 {/* Selection Controls */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                       <button 
                         onClick={() => setActiveTab('products')}
                         className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all ${
                           activeTab === 'products' ? 'bg-[#001828] text-white shadow-md' : 'text-[#64748b] hover:text-[#001828]'
                         }`}
                       >
                          Products ({allProducts.length})
                       </button>
                       <button 
                         onClick={() => setActiveTab('baseItems')}
                         className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all ${
                           activeTab === 'baseItems' ? 'bg-[#001828] text-white shadow-md' : 'text-[#64748b] hover:text-[#001828]'
                         }`}
                       >
                          Base Items ({allBaseItems.length})
                       </button>
                    </div>

                    <div className="relative flex-1 max-w-md">
                       <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                       <input 
                         type="text" 
                         placeholder={`Search ${activeTab === 'products' ? 'products' : 'items'}...`}
                         value={itemSearchQuery}
                         onChange={(e) => setItemSearchQuery(e.target.value)}
                         className="w-full pl-12 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#001828] transition-all"
                       />
                    </div>
                 </div>

                 {/* Selection Grid */}
                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-slate-50/50 rounded-2xl border border-[#e2e8f0] p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                       {activeTab === 'products' ? (
                         allProducts
                           .filter(p => p.name.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                           .map(product => {
                             const isSelected = tempProductIds.includes(product.id);
                             return (
                               <div 
                                 key={product.id}
                                 onClick={() => setTempProductIds(prev => isSelected ? prev.filter(id => id !== product.id) : [...prev, product.id])}
                                 className={`p-5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer group hover:scale-[1.01] ${isSelected ? 'bg-white border-[#001828] shadow-lg shadow-[#001828]/5' : 'bg-white border-transparent hover:border-[#e2e8f0]'}`}
                               >
                                  <div className="flex items-center gap-4">
                                     <div className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-[#001828] text-white' : 'bg-gray-100 text-slate-400'}`}>
                                        <Package size={20} />
                                     </div>
                                     <div>
                                        <p className="font-bold text-[#1e293b] text-sm">{product.name}</p>
                                        <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">₹{product.price} • {product.category}</p>
                                     </div>
                                  </div>
                                  <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-[#001828] border-[#001828]' : 'border-slate-200 bg-white'}`}>
                                     {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                  </div>
                               </div>
                             )
                           })
                       ) : (
                         allBaseItems
                           .filter(b => b.name.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                           .map(baseItem => {
                             const isSelected = tempBaseItemIds.includes(baseItem.id);
                             return (
                               <div 
                                 key={baseItem.id}
                                 onClick={() => setTempBaseItemIds(prev => isSelected ? prev.filter(id => id !== baseItem.id) : [...prev, baseItem.id])}
                                 className={`p-5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer group hover:scale-[1.01] ${isSelected ? 'bg-white border-[#001828] shadow-lg shadow-[#001828]/5' : 'bg-white border-transparent hover:border-[#e2e8f0]'}`}
                               >
                                  <div className="flex items-center gap-4">
                                     <div className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-[#001828] text-white' : 'bg-gray-100 text-slate-400'}`}>
                                        <Layers size={20} />
                                     </div>
                                     <p className="font-bold text-[#1e293b] text-sm">{baseItem.name}</p>
                                  </div>
                                  <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-[#001828] border-[#001828]' : 'border-slate-200 bg-white'}`}>
                                     {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                  </div>
                               </div>
                             )
                           })
                       )}
                    </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-6 bg-gray-50 border-t border-[#e2e8f0] flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest">Active Selections</span>
                       <span className="text-sm font-bold text-[#001828]">{tempProductIds.length} Products, {tempBaseItemIds.length} Items</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-4">
                    <button onClick={() => setIsItemModalOpen(false)} className="px-6 py-2.5 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-[0.1em] text-[10px]">
                      Cancel
                    </button>
                    <button 
                      onClick={saveItemAssociations}
                      disabled={isSaving}
                      className="px-8 py-2.5 bg-[#001828] text-white font-bold rounded-xl shadow-lg shadow-[#001828]/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} strokeWidth={3} /> Save Inventory</>}
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Session Configuration Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <div className="fixed inset-0 bg-[#001828]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1e293b]">Operating Hours</h2>
                    <p className="text-sm text-[#64748b]">Select the days and times this counter will be active</p>
                  </div>
                  <button onClick={() => setShowSessionModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} className="text-[#64748b]" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
                  {formData.sessions.map((session, index) => (
                    <div key={session.dayOfWeek} className={`p-6 rounded-3xl border-2 transition-all ${session.active ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50 opacity-60'}`}>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-lg font-bold text-[#1e293b]">{session.dayOfWeek}</span>
                        <div 
                          onClick={() => updateSession(index, { active: !session.active })}
                          className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${session.active ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${session.active ? 'translate-x-6' : ''}`} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-[10px] font-bold text-[#94a3b8] mb-1.5 uppercase ml-1">Start Time</label>
                          <div className="flex items-center px-4 py-3 bg-white border border-[#e2e8f0] rounded-2xl">
                            <input 
                              type="time" 
                              disabled={!session.active}
                              value={session.startTime} 
                              onChange={(e) => updateSession(index, { startTime: e.target.value })}
                              className="bg-transparent border-none outline-none text-sm font-bold text-[#1e293b] w-full disabled:text-gray-300" 
                            />
                            <Clock size={16} className={session.active ? "text-indigo-400" : "text-slate-200"} />
                          </div>
                        </div>
                        <div className="relative">
                          <label className="block text-[10px] font-bold text-[#94a3b8] mb-1.5 uppercase ml-1">End Time</label>
                          <div className="flex items-center px-4 py-3 bg-white border border-[#e2e8f0] rounded-2xl">
                            <input 
                              type="time" 
                              disabled={!session.active}
                              value={session.endTime} 
                              onChange={(e) => updateSession(index, { endTime: e.target.value })}
                              className="bg-transparent border-none outline-none text-sm font-bold text-[#1e293b] w-full disabled:text-gray-300" 
                            />
                            <Clock size={16} className={session.active ? "text-indigo-400" : "text-slate-200"} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-4 mt-10">
                  <button onClick={() => setShowSessionModal(false)} className="px-10 py-4 bg-[#001828] text-white font-bold rounded-2xl shadow-xl shadow-[#001828]/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      ` }} />
    </div>
  );
};

export default Stalls;
